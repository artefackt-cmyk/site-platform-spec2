import {
  collectPageDocumentImageAssetIds,
  migratePageDocumentToLatest
} from "@site-platform/editor-core";
import type { TenantContext } from "@site-platform/domain";
import type { MediaAsset } from "@prisma/client";
import { ProjectRepository } from "./project-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateMediaAssetInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly storageKey: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly altText?: string | null;
  readonly createdByUserId: string;
};

export type UpdateMediaAssetMetadataInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly assetId: string;
  readonly altText?: string | null;
};

export type MediaAssetUsage = {
  readonly usageCount: number;
  readonly pageIds: readonly string[];
};

export class MediaAssetRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProject(
    context: TenantContext,
    projectId: string
  ): Promise<readonly MediaAsset[]> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      return [];
    }

    return this.client.mediaAsset.findMany({
      where: activeMediaAssetScope(context, projectId),
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async findByIdForProject(
    context: TenantContext,
    projectId: string,
    assetId: string
  ): Promise<MediaAsset | null> {
    return this.client.mediaAsset.findFirst({
      where: {
        ...activeMediaAssetScope(context, projectId),
        id: assetId
      }
    });
  }

  async create(input: CreateMediaAssetInput): Promise<MediaAsset | null> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: input.tenantContext,
      projectId: input.projectId
    });

    if (project === null || project.organizationId !== input.tenantContext.organizationId) {
      return null;
    }

    return this.client.mediaAsset.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        storageKey: input.storageKey,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        altText: input.altText ?? null,
        createdByUserId: input.createdByUserId
      }
    });
  }

  async updateMetadata(
    input: UpdateMediaAssetMetadataInput
  ): Promise<MediaAsset | null> {
    const result = await this.client.mediaAsset.updateMany({
      where: {
        ...activeMediaAssetScope(input.tenantContext, input.projectId),
        id: input.assetId
      },
      data: {
        altText: input.altText ?? null
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForProject(
      input.tenantContext,
      input.projectId,
      input.assetId
    );
  }

  async delete(
    context: TenantContext,
    projectId: string,
    assetId: string
  ): Promise<MediaAsset | null> {
    const asset = await this.findByIdForProject(context, projectId, assetId);

    if (asset === null) {
      return null;
    }

    await this.client.mediaAsset.delete({
      where: {
        id: asset.id
      }
    });

    return asset;
  }

  async countUsage(
    context: TenantContext,
    projectId: string,
    assetId: string
  ): Promise<MediaAssetUsage> {
    const pageDocuments = await this.client.pageDocument.findMany({
      where: {
        organizationId: context.organizationId,
        projectId,
        page: {
          organizationId: context.organizationId,
          projectId,
          deletedAt: null,
          project: {
            organizationId: context.organizationId,
            deletedAt: null
          }
        }
      },
      select: {
        pageId: true,
        document: true
      }
    });
    const pageIds = new Set<string>();
    let usageCount = 0;

    for (const pageDocument of pageDocuments) {
      const migration = migratePageDocumentToLatest(pageDocument.document);

      if (!migration.ok) {
        throw new Error(
          `Cannot count media asset usage for invalid page document ${pageDocument.pageId}.`
        );
      }

      const countInPage = collectPageDocumentImageAssetIds(
        migration.document
      ).filter((currentAssetId) => currentAssetId === assetId).length;

      if (countInPage > 0) {
        pageIds.add(pageDocument.pageId);
        usageCount += countInPage;
      }
    }

    return {
      usageCount,
      pageIds: [...pageIds]
    };
  }
}

function activeMediaAssetScope(context: TenantContext, projectId: string) {
  return {
    organizationId: context.organizationId,
    projectId,
    project: {
      organizationId: context.organizationId,
      deletedAt: null
    }
  };
}
