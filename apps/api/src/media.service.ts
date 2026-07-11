import { createReadStream } from "node:fs";
import { Inject, Injectable, StreamableFile } from "@nestjs/common";
import type { AppConfig } from "@site-platform/config";
import {
  AuditLogRepository,
  MediaAssetRepository,
  ProjectRepository,
  type DatabasePrismaClient,
  type MediaAsset
} from "@site-platform/database";
import {
  collectPageDocumentImageAssetIds,
  validatePageDocument
} from "@site-platform/editor-core";
import {
  LocalMediaStorage,
  UploadValidationError,
  validateImageUpload,
  type MediaStorage
} from "@site-platform/media-storage";
import {
  API_ERROR_CODES,
  badRequest,
  conflict,
  notFound
} from "./api-errors";
import { APP_CONFIG } from "./app-config.provider";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import { DATABASE_CLIENT } from "./database.provider";

export type UploadedMediaFile = {
  readonly originalname: string;
  readonly mimetype: string;
  readonly size: number;
  readonly buffer: Buffer;
};

export type MediaAssetResponse = {
  readonly id: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly url: string;
  readonly createdAt: string;
  readonly usageCount: number;
};

export type MediaAssetsListResponse = {
  readonly assets: readonly MediaAssetResponse[];
};

export type UploadMediaAssetResponse = {
  readonly asset: MediaAssetResponse;
};

export type UpdateMediaAssetResponse = {
  readonly asset: MediaAssetResponse;
};

export type DeleteMediaAssetResponse = {
  readonly deleted: true;
};

export type LocalMediaContent = {
  readonly file: StreamableFile;
  readonly mimeType: string;
  readonly cacheControl: string;
};

@Injectable()
export class MediaService {
  private readonly storage: MediaStorage;

  constructor(
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver,
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {
    this.storage = new LocalMediaStorage({
      baseDirectory: this.config.media.storageDir,
      publicBaseUrl: this.config.media.publicBaseUrl
    });
  }

  async listProjectMedia(projectId: string): Promise<MediaAssetsListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.getProjectOrThrow(identity.tenantContext, projectId);
    const repository = new MediaAssetRepository(this.client);
    const assets = await repository.listByProject(identity.tenantContext, projectId);
    const responses = await Promise.all(
      assets.map(async (asset) => {
        const usage = await repository.countUsage(
          identity.tenantContext,
          projectId,
          asset.id
        );

        return toMediaAssetResponse(asset, projectId, usage.usageCount, this.config);
      })
    );

    return {
      assets: responses
    };
  }

  async uploadProjectMedia(
    projectId: string,
    file: UploadedMediaFile | undefined,
    body: unknown
  ): Promise<UploadMediaAssetResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (file === undefined) {
      throw badRequest(API_ERROR_CODES.mediaAssetInvalid, "Media file is required.", [
        {
          field: "file",
          code: "FIELD_REQUIRED",
          message: "File is required."
        }
      ]);
    }

    const metadata = parseMediaUploadBody(body);
    const imageMetadata = validateUploadedFile(file);
    const putResult = await this.storage.put({
      organizationId: identity.tenantContext.organizationId,
      projectId,
      content: file.buffer,
      mimeType: imageMetadata.mimeType
    });

    try {
      const asset = await this.client.$transaction(async (transaction) => {
        const repository = new MediaAssetRepository(transaction);
        const auditLogRepository = new AuditLogRepository(transaction);
        const created = await repository.create({
          tenantContext: identity.tenantContext,
          projectId,
          storageKey: putResult.storageKey,
          originalFilename: sanitizeOriginalFilename(file.originalname),
          mimeType: imageMetadata.mimeType,
          sizeBytes: file.size,
          width: imageMetadata.width,
          height: imageMetadata.height,
          altText: metadata.altText,
          createdByUserId: identity.user.id
        });

        if (created === null) {
          throw new Error("Media project scope disappeared during upload.");
        }

        await auditLogRepository.create({
          organizationId: identity.tenantContext.organizationId,
          actorUserId: identity.user.id,
          action: "media.asset.created",
          entityType: "MediaAsset",
          entityId: created.id,
          metadata: {
            projectId,
            mimeType: created.mimeType,
            sizeBytes: created.sizeBytes
          }
        });

        return created;
      });

      return {
        asset: toMediaAssetResponse(asset, projectId, 0, this.config)
      };
    } catch (error) {
      await this.storage.delete(putResult.storageKey);
      throw error;
    }
  }

  async updateProjectMedia(
    projectId: string,
    assetId: string,
    body: unknown
  ): Promise<UpdateMediaAssetResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.getProjectOrThrow(identity.tenantContext, projectId);
    const payload = parseUpdateMediaPayload(body);
    const repository = new MediaAssetRepository(this.client);
    const asset = await repository.updateMetadata({
      tenantContext: identity.tenantContext,
      projectId,
      assetId,
      altText: payload.altText
    });

    if (asset === null) {
      throw mediaNotFoundError();
    }

    const usage = await repository.countUsage(
      identity.tenantContext,
      projectId,
      asset.id
    );

    return {
      asset: toMediaAssetResponse(asset, projectId, usage.usageCount, this.config)
    };
  }

  async deleteProjectMedia(
    projectId: string,
    assetId: string
  ): Promise<DeleteMediaAssetResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.getProjectOrThrow(identity.tenantContext, projectId);
    const repository = new MediaAssetRepository(this.client);
    const asset = await repository.findByIdForProject(
      identity.tenantContext,
      projectId,
      assetId
    );

    if (asset === null) {
      throw mediaNotFoundError();
    }

    const usage = await repository.countUsage(
      identity.tenantContext,
      projectId,
      asset.id
    );

    if (usage.usageCount > 0) {
      throw conflict(
        API_ERROR_CODES.mediaAssetInUse,
        `Media asset is used ${usage.usageCount} time(s).`
      );
    }

    const publishedUsageCount = await this.countPublishedUsage(
      identity.tenantContext.organizationId,
      projectId,
      asset.id
    );

    if (publishedUsageCount > 0) {
      throw conflict(
        API_ERROR_CODES.mediaAssetInUse,
        `Media asset is used ${publishedUsageCount} time(s) in published pages.`
      );
    }

    await this.storage.delete(asset.storageKey);
    await this.client.$transaction(async (transaction) => {
      const scopedRepository = new MediaAssetRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const deleted = await scopedRepository.delete(
        identity.tenantContext,
        projectId,
        asset.id
      );

      if (deleted === null) {
        throw mediaNotFoundError();
      }

      await auditLogRepository.create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: "media.asset.deleted",
        entityType: "MediaAsset",
        entityId: asset.id,
        metadata: {
          projectId,
          storageKey: asset.storageKey
        }
      });
    });

    return {
      deleted: true
    };
  }

  async getProjectMediaContent(
    projectId: string,
    assetId: string
  ): Promise<LocalMediaContent> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    await this.getProjectOrThrow(identity.tenantContext, projectId);
    const asset = await new MediaAssetRepository(this.client).findByIdForProject(
      identity.tenantContext,
      projectId,
      assetId
    );

    if (asset === null) {
      throw mediaNotFoundError();
    }

    const localPath = this.storage.resolveLocalPath(asset.storageKey);

    return {
      file: new StreamableFile(createReadStream(localPath)),
      mimeType: asset.mimeType,
      cacheControl: "public, max-age=3600"
    };
  }

  private async getProjectOrThrow(
    tenantContext: Awaited<
      ReturnType<CurrentIdentityResolver["getCurrentIdentity"]>
    >["tenantContext"],
    projectId: string
  ): Promise<void> {
    const project = await new ProjectRepository(this.client).findByTenantContextAndId({
      tenantContext,
      projectId
    });

    if (project === null) {
      throw notFound(API_ERROR_CODES.projectNotFound, "Project was not found.");
    }
  }

  private async countPublishedUsage(
    organizationId: string,
    projectId: string,
    assetId: string
  ): Promise<number> {
    const states = await this.client.publishedPageState.findMany({
      where: {
        organizationId,
        projectId,
        activeSnapshotId: {
          not: null
        },
        page: {
          deletedAt: null,
          project: {
            deletedAt: null
          }
        }
      },
      include: {
        activeSnapshot: true
      }
    });

    return states.reduce((count, state) => {
      if (state.activeSnapshot === null) {
        return count;
      }

      const validation = validatePageDocument(state.activeSnapshot.documentJson);

      if (!validation.ok) {
        throw new Error(
          `Cannot count media usage for invalid published snapshot ${state.activeSnapshot.id}.`
        );
      }

      return (
        count +
        collectPageDocumentImageAssetIds(validation.document).filter(
          (currentAssetId) => currentAssetId === assetId
        ).length
      );
    }, 0);
  }
}

export function createMediaAssetUrl(
  config: AppConfig,
  projectId: string,
  assetId: string
): string {
  return `${config.media.publicBaseUrl.replace(
    /\/$/,
    ""
  )}/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(
    assetId
  )}/content`;
}

function toMediaAssetResponse(
  asset: MediaAsset,
  projectId: string,
  usageCount: number,
  config: AppConfig
): MediaAssetResponse {
  return {
    id: asset.id,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    url: createMediaAssetUrl(config, projectId, asset.id),
    createdAt: asset.createdAt.toISOString(),
    usageCount
  };
}

function validateUploadedFile(file: UploadedMediaFile) {
  try {
    return validateImageUpload(file.buffer, file.mimetype);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      throw badRequest(API_ERROR_CODES.mediaAssetInvalid, error.message, [
        {
          field: "file",
          code: "MEDIA_INVALID",
          message: error.message
        }
      ]);
    }

    throw error;
  }
}

function parseMediaUploadBody(body: unknown): {
  readonly altText: string | null;
} {
  if (!isRecord(body)) {
    return {
      altText: null
    };
  }

  return {
    altText: parseNullableString(body.altText)
  };
}

function parseUpdateMediaPayload(body: unknown): {
  readonly altText: string | null;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  return {
    altText: parseNullableString(body.altText)
  };
}

function parseNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function sanitizeOriginalFilename(filename: string): string {
  const sanitized = filename.replace(/\0/g, "").trim();

  return sanitized === "" ? "upload" : sanitized;
}

function mediaNotFoundError() {
  return notFound(API_ERROR_CODES.mediaAssetNotFound, "Media asset was not found.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
