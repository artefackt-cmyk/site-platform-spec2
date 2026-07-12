import { createReadStream } from "node:fs";
import { Inject, Injectable, StreamableFile } from "@nestjs/common";
import type { AppConfig } from "@site-platform/config";
import {
  AuditLogRepository,
  MediaAssetRepository,
  PageDocumentRepository,
  ProductMediaRepository,
  ProductRepository,
  ProjectPublicationSettingsRepository,
  ProjectRepository,
  ProjectSiteSettingsRepository,
  PublishedPageSnapshotRepository,
  PublishedPageStateRepository,
  SitePageRepository,
  createDefaultFooterDraft,
  createDefaultHeaderDraft,
  toSiteSettingsSnapshotJson,
  type DatabasePrismaClient,
  type MediaAsset,
  type PageDocumentRecord,
  type ProductVariant,
  type ProductWithPrimaryMedia,
  type PublishedPageSnapshot,
  type RepositoryPrismaClient,
  type SiteSettingsSnapshotJson,
  type SitePage
} from "@site-platform/database";
import {
  collectPageDocumentImageAssetIds,
  validatePageDocument,
  type BlockNode,
  type ColumnNode,
  type PageDocumentV2,
  type SectionNode
} from "@site-platform/editor-core";
import {
  DOMAIN_ERROR_CODES,
  PERMISSIONS,
  formatRubMoney,
  getProductAvailability,
  hasPermission,
  type Permission,
  type TenantContext,
  validatePageSlug,
  validatePublicHandle
} from "@site-platform/domain";
import { LocalMediaStorage, type MediaStorage } from "@site-platform/media-storage";
import { APP_CONFIG } from "./app-config.provider";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import { DATABASE_CLIENT } from "./database.provider";
import {
  API_ERROR_CODES,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "./api-errors";

export type PublicationStatus =
  | "never-published"
  | "published-current"
  | "published-with-changes"
  | "unpublished";

export type PublicationStatusResponse = {
  readonly status: PublicationStatus;
  readonly publicUrl: string | null;
  readonly activeSnapshotId: string | null;
  readonly activeVersion: number | null;
  readonly publishedAt: string | null;
};

export type PublicationSettingsResponse = {
  readonly publicHandle: string;
  readonly basePublicUrl: string;
  readonly projectPublicUrl: string;
  readonly constraints: {
    readonly minLength: 3;
    readonly maxLength: 48;
    readonly pattern: string;
    readonly reserved: readonly string[];
  };
};

export type PublishPageResponse = {
  readonly snapshotId: string;
  readonly version: number;
  readonly publicationStatus: PublicationStatusResponse;
  readonly publicUrl: string;
  readonly publishedAt: string;
};

export type PublicationHistoryResponse = {
  readonly publications: readonly PublicationHistoryItem[];
};

export type PublicationHistoryItem = {
  readonly snapshotId: string;
  readonly version: number;
  readonly pageTitle: string;
  readonly pageSlug: string;
  readonly sourceRevision: number;
  readonly publishedAt: string;
  readonly publishedBy: string | null;
  readonly active: boolean;
  readonly rollbackSourceSnapshotId: string | null;
};

export type PublicSitePageResponse = {
  readonly projectName: string;
  readonly pageTitle: string;
  readonly pageSlug: string;
  readonly snapshotVersion: number;
  readonly document: PageDocumentV2;
  readonly publishedAt: string;
  readonly canonicalPath: string;
  readonly navigation: readonly PublicSiteNavigationItem[];
  readonly products: Readonly<Record<string, PublicProductRenderModel>>;
  readonly productList: readonly PublicProductRenderModel[];
  readonly siteSettings: SiteSettingsSnapshotJson;
};

export type PublicSiteNavigationItem = {
  readonly pageId: string;
  readonly title: string;
  readonly slug: string;
  readonly publicUrl: string;
};

export type PublicProductRenderModel = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly primaryImage: {
    readonly url: string;
    readonly altText: string | null;
  } | null;
  readonly images: readonly {
    readonly id: string;
    readonly url: string;
    readonly altText: string | null;
    readonly width: number | null;
    readonly height: number | null;
    readonly position: number;
    readonly isPrimary: boolean;
  }[];
  readonly price: {
    readonly amountMinor: number;
    readonly currency: "RUB";
    readonly formatted: string;
  } | null;
  readonly availability: "in-stock" | "out-of-stock" | "preorder";
  readonly publicUrl: string;
};

export type PublicMediaContent = {
  readonly file: StreamableFile;
  readonly mimeType: string;
  readonly cacheControl: string;
  readonly lastModified: string;
};

const RESERVED_PUBLIC_HANDLES = [
  "api",
  "admin",
  "dashboard",
  "login",
  "signup",
  "media",
  "assets",
  "preview",
  "projects",
  "static",
  "health",
  "www"
] as const;

@Injectable()
export class PublicationService {
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

  async getPublicationSettings(
    projectId: string
  ): Promise<PublicationSettingsResponse> {
    const identity = await this.requireIdentityWithPermission(
      PERMISSIONS.projectRead
    );
    const settings = await this.getOrCreateSettings(
      identity.tenantContext,
      projectId
    );

    return toPublicationSettingsResponse(settings.publicHandle, this.config);
  }

  async updatePublicationSettings(
    projectId: string,
    body: unknown
  ): Promise<PublicationSettingsResponse> {
    const identity = await this.requireIdentityWithPermission(
      PERMISSIONS.projectUpdate
    );
    const publicHandle = parsePublicHandlePayload(body);
    await this.getProjectOrThrow(identity.tenantContext, projectId);

    try {
      const settings = await this.client.$transaction(async (transaction) => {
        const repository = new ProjectPublicationSettingsRepository(transaction);
        const auditLogRepository = new AuditLogRepository(transaction);
        const updated = await repository.updateHandle({
          tenantContext: identity.tenantContext,
          projectId,
          publicHandle
        });

        if (updated === null) {
          throw projectNotFoundError();
        }

        await auditLogRepository.create({
          organizationId: identity.tenantContext.organizationId,
          actorUserId: identity.user.id,
          action: "publication.settings.updated",
          entityType: "ProjectPublicationSettings",
          entityId: updated.id,
          metadata: {
            projectId,
            publicHandle
          }
        });

        return updated;
      });

      return toPublicationSettingsResponse(settings.publicHandle, this.config);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw conflict(
          API_ERROR_CODES.publicHandleConflict,
          "Public handle is already in use."
        );
      }

      throw error;
    }
  }

  async getPagePublicationStatus(
    projectId: string,
    pageId: string
  ): Promise<PublicationStatusResponse> {
    const identity = await this.requireIdentityWithPermission(PERMISSIONS.pageRead);
    const page = await this.getPageOrThrow(
      identity.tenantContext,
      projectId,
      pageId
    );
    const pageDocument = await new PageDocumentRepository(this.client).findByPage(
      identity.tenantContext,
      projectId,
      pageId
    );

    return this.calculatePublicationStatus(
      identity.tenantContext,
      projectId,
      page,
      pageDocument
    );
  }

  async publishPage(projectId: string, pageId: string, body: unknown) {
    const identity = await this.requireIdentityWithPermission(
      PERMISSIONS.pageUpdate
    );
    const payload = parsePublishPayload(body);
    const page = await this.getPageOrThrow(
      identity.tenantContext,
      projectId,
      pageId
    );
    const pageDocument = await new PageDocumentRepository(this.client).findByPage(
      identity.tenantContext,
      projectId,
      pageId
    );

    if (pageDocument === null) {
      throw notFound(API_ERROR_CODES.pageDraftNotFound, "Page draft was not found.");
    }

    if (pageDocument.revision !== payload.expectedRevision) {
      throw conflict(
        API_ERROR_CODES.pageDraftRevisionMismatch,
        "Page draft revision does not match expectedRevision."
      );
    }

    await this.validatePublishableDraft(identity.tenantContext, projectId, page, pageDocument);
    const settings = await this.getOrCreateSettings(
      identity.tenantContext,
      projectId
    );
    const siteSettingsSnapshot = await this.getSiteSettingsSnapshot(
      identity.tenantContext,
      projectId
    );
    const activeSnapshot = await this.findActiveSnapshot(
      identity.tenantContext,
      projectId,
      pageId
    );

    if (
      activeSnapshot !== null &&
      activeSnapshot.sourceRevision === pageDocument.revision &&
      activeSnapshot.pageTitle === page.title &&
      activeSnapshot.pageSlug === page.slug &&
      getSnapshotSiteSettingsRevision(activeSnapshot) === siteSettingsSnapshot.revision
    ) {
      const status = await this.calculatePublicationStatus(
        identity.tenantContext,
        projectId,
        page,
        pageDocument
      );

      return {
        snapshotId: activeSnapshot.id,
        version: activeSnapshot.version,
        publicationStatus: status,
        publicUrl: createPublicPageUrl(this.config, settings.publicHandle, page.slug),
        publishedAt: activeSnapshot.publishedAt.toISOString()
      } satisfies PublishPageResponse;
    }

    const publishedAt = new Date();
    const snapshot = await this.client.$transaction(async (transaction) => {
      const snapshotRepository = new PublishedPageSnapshotRepository(transaction);
      const stateRepository = new PublishedPageStateRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const createdSnapshot = await snapshotRepository.create({
        tenantContext: identity.tenantContext,
        projectId,
        pageId,
        pageTitle: page.title,
        pageSlug: page.slug,
        document: pageDocument.document,
        siteSettingsSnapshot,
        sourceRevision: pageDocument.revision,
        publishedByUserId: identity.user.id,
        publishedAt
      });

      if (createdSnapshot === null) {
        throw pageNotFoundError();
      }

      await stateRepository.activate({
        tenantContext: identity.tenantContext,
        projectId,
        pageId,
        snapshotId: createdSnapshot.id,
        publishedAt
      });
      await auditLogRepository.create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: "page.published",
        entityType: "PublishedPageSnapshot",
        entityId: createdSnapshot.id,
        metadata: {
          projectId,
          pageId,
          version: createdSnapshot.version,
          pageSlug: createdSnapshot.pageSlug
        }
      });

      return createdSnapshot;
    });
    const status = await this.calculatePublicationStatus(
      identity.tenantContext,
      projectId,
      page,
      pageDocument
    );

    return {
      snapshotId: snapshot.id,
      version: snapshot.version,
      publicationStatus: status,
      publicUrl: createPublicPageUrl(this.config, settings.publicHandle, snapshot.pageSlug),
      publishedAt: snapshot.publishedAt.toISOString()
    } satisfies PublishPageResponse;
  }

  async unpublishPage(projectId: string, pageId: string) {
    const identity = await this.requireIdentityWithPermission(
      PERMISSIONS.pageUpdate
    );
    const page = await this.getPageOrThrow(
      identity.tenantContext,
      projectId,
      pageId
    );
    const state = await new PublishedPageStateRepository(this.client).findByPage(
      identity.tenantContext,
      projectId,
      pageId
    );

    if (state === null || state.activeSnapshotId === null) {
      throw notFound(API_ERROR_CODES.pageNotPublished, "Page is not published.");
    }

    await this.client.$transaction(async (transaction) => {
      const stateRepository = new PublishedPageStateRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);

      await stateRepository.unpublish(
        identity.tenantContext,
        projectId,
        pageId,
        new Date()
      );
      await auditLogRepository.create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: "page.unpublished",
        entityType: "SitePage",
        entityId: pageId,
        metadata: {
          projectId
        }
      });
    });

    return {
      publicationStatus: await this.calculatePublicationStatus(
        identity.tenantContext,
        projectId,
        page,
        await new PageDocumentRepository(this.client).findByPage(
          identity.tenantContext,
          projectId,
          pageId
        )
      )
    };
  }

  async listPagePublications(
    projectId: string,
    pageId: string
  ): Promise<PublicationHistoryResponse> {
    const identity = await this.requireIdentityWithPermission(PERMISSIONS.pageRead);
    await this.getPageOrThrow(identity.tenantContext, projectId, pageId);
    const [snapshots, state] = await Promise.all([
      new PublishedPageSnapshotRepository(this.client).listByPage(
        identity.tenantContext,
        projectId,
        pageId
      ),
      new PublishedPageStateRepository(this.client).findByPage(
        identity.tenantContext,
        projectId,
        pageId
      )
    ]);

    return {
      publications: snapshots.map((snapshot) => ({
        snapshotId: snapshot.id,
        version: snapshot.version,
        pageTitle: snapshot.pageTitle,
        pageSlug: snapshot.pageSlug,
        sourceRevision: snapshot.sourceRevision,
        publishedAt: snapshot.publishedAt.toISOString(),
        publishedBy: snapshot.publishedByUserId,
        active: state?.activeSnapshotId === snapshot.id,
        rollbackSourceSnapshotId: snapshot.rollbackSourceSnapshotId
      }))
    };
  }

  async rollbackPagePublication(
    projectId: string,
    pageId: string,
    snapshotId: string
  ): Promise<PublishPageResponse> {
    const identity = await this.requireIdentityWithPermission(
      PERMISSIONS.pageUpdate
    );
    const page = await this.getPageOrThrow(
      identity.tenantContext,
      projectId,
      pageId
    );
    const sourceSnapshot =
      await new PublishedPageSnapshotRepository(this.client).findByIdForPage(
        identity.tenantContext,
        projectId,
        pageId,
        snapshotId
      );

    if (sourceSnapshot === null) {
      throw notFound(
        API_ERROR_CODES.publicationSnapshotNotFound,
        "Publication snapshot was not found."
      );
    }

    const settings = await this.getOrCreateSettings(
      identity.tenantContext,
      projectId
    );
    const siteSettingsSnapshot = await this.getSiteSettingsSnapshot(
      identity.tenantContext,
      projectId
    );
    const validation = validatePageDocument(sourceSnapshot.documentJson);

    if (!validation.ok) {
      throw badRequest(
        API_ERROR_CODES.pageDraftInvalid,
        "Stored publication snapshot is invalid."
      );
    }

    const publishedAt = new Date();
    const snapshot = await this.client.$transaction(async (transaction) => {
      const snapshotRepository = new PublishedPageSnapshotRepository(transaction);
      const stateRepository = new PublishedPageStateRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const createdSnapshot = await snapshotRepository.create({
        tenantContext: identity.tenantContext,
        projectId,
        pageId,
        pageTitle: sourceSnapshot.pageTitle,
        pageSlug: sourceSnapshot.pageSlug,
        document: validation.document,
        siteSettingsSnapshot,
        sourceRevision: sourceSnapshot.sourceRevision,
        publishedByUserId: identity.user.id,
        rollbackSourceSnapshotId: sourceSnapshot.id,
        publishedAt
      });

      if (createdSnapshot === null) {
        throw pageNotFoundError();
      }

      await stateRepository.activate({
        tenantContext: identity.tenantContext,
        projectId,
        pageId,
        snapshotId: createdSnapshot.id,
        publishedAt
      });
      await auditLogRepository.create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: "page.publication.rollback",
        entityType: "PublishedPageSnapshot",
        entityId: createdSnapshot.id,
        metadata: {
          projectId,
          pageId,
          sourceSnapshotId: sourceSnapshot.id,
          version: createdSnapshot.version
        }
      });

      return createdSnapshot;
    });

    return {
      snapshotId: snapshot.id,
      version: snapshot.version,
      publicationStatus: await this.calculatePublicationStatus(
        identity.tenantContext,
        projectId,
        page,
        await new PageDocumentRepository(this.client).findByPage(
          identity.tenantContext,
          projectId,
          pageId
        )
      ),
      publicUrl: createPublicPageUrl(this.config, settings.publicHandle, snapshot.pageSlug),
      publishedAt: snapshot.publishedAt.toISOString()
    };
  }

  private async validatePublishableDraft(
    context: TenantContext,
    projectId: string,
    page: SitePage,
    pageDocument: PageDocumentRecord
  ): Promise<void> {
    const slugResult = validatePageSlug(page.slug);

    if (!slugResult.ok) {
      throw badRequest(API_ERROR_CODES.pageSlugInvalid, "Page slug is invalid.", [
        {
          field: "slug",
          code: slugResult.code,
          message: `Page slug is invalid: ${slugResult.code}.`
        }
      ]);
    }

    const validation = validatePageDocument(pageDocument.document);

    if (!validation.ok) {
      throw badRequest(API_ERROR_CODES.pageDraftInvalid, "Page draft is invalid.");
    }

    const mediaAssetIds = [...new Set(collectPageDocumentImageAssetIds(validation.document))];
    const mediaAssetRepository = new MediaAssetRepository(this.client);

    for (const assetId of mediaAssetIds) {
      const asset = await mediaAssetRepository.findByIdForProject(
        context,
        projectId,
        assetId
      );

      if (asset === null) {
        throw badRequest(
          API_ERROR_CODES.mediaAssetMissing,
          "Media asset referenced by draft was not found.",
          [
            {
              field: "document",
              code: "MEDIA_INVALID",
              message: `Media asset ${assetId} was not found in this project.`
            }
          ]
        );
      }

      if (!(await this.storage.exists(asset.storageKey))) {
        throw badRequest(
          API_ERROR_CODES.mediaAssetFileMissing,
          "Media asset file referenced by draft was not found.",
          [
            {
              field: "document",
              code: "MEDIA_INVALID",
              message: `Media asset file ${assetId} is missing.`
            }
          ]
        );
      }
    }
  }

  private async calculatePublicationStatus(
    context: TenantContext,
    projectId: string,
    page: SitePage,
    pageDocument: PageDocumentRecord | null
  ): Promise<PublicationStatusResponse> {
    const [state, latestSnapshot, settings] = await Promise.all([
      new PublishedPageStateRepository(this.client).findByPage(
        context,
        projectId,
        page.id
      ),
      new PublishedPageSnapshotRepository(this.client).getLatestByPage(
        context,
        projectId,
        page.id
      ),
      this.getOrCreateSettings(context, projectId)
    ]);

    if (state === null || state.activeSnapshotId === null) {
      return {
        status: latestSnapshot === null ? "never-published" : "unpublished",
        publicUrl: null,
        activeSnapshotId: null,
        activeVersion: null,
        publishedAt: null
      };
    }

    const activeSnapshot = await this.findActiveSnapshot(context, projectId, page.id);

    if (activeSnapshot === null) {
      return {
        status: latestSnapshot === null ? "never-published" : "unpublished",
        publicUrl: null,
        activeSnapshotId: null,
        activeVersion: null,
        publishedAt: null
      };
    }

    const siteSettingsSnapshot = await this.getSiteSettingsSnapshot(
      context,
      projectId
    );
    const draftChanged =
      pageDocument === null ||
      pageDocument.revision !== activeSnapshot.sourceRevision ||
      page.title !== activeSnapshot.pageTitle ||
      page.slug !== activeSnapshot.pageSlug ||
      getSnapshotSiteSettingsRevision(activeSnapshot) !==
        siteSettingsSnapshot.revision;

    return {
      status: draftChanged ? "published-with-changes" : "published-current",
      publicUrl: createPublicPageUrl(
        this.config,
        settings.publicHandle,
        activeSnapshot.pageSlug
      ),
      activeSnapshotId: activeSnapshot.id,
      activeVersion: activeSnapshot.version,
      publishedAt: activeSnapshot.publishedAt.toISOString()
    };
  }

  private async findActiveSnapshot(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PublishedPageSnapshot | null> {
    const state = await this.client.publishedPageState.findFirst({
      where: {
        organizationId: context.organizationId,
        projectId,
        pageId,
        activeSnapshotId: {
          not: null
        }
      },
      include: {
        activeSnapshot: true
      }
    });

    return state?.activeSnapshot ?? null;
  }

  private async getOrCreateSettings(
    context: TenantContext,
    projectId: string
  ) {
    const project = await this.getProjectOrThrow(context, projectId);
    const repository = new ProjectPublicationSettingsRepository(this.client);
    const existing = await repository.findByProject(context, projectId);

    if (existing !== null) {
      return existing;
    }

    return this.client.$transaction(async (transaction) => {
      const transactionRepository = new ProjectPublicationSettingsRepository(
        transaction
      );
      const publicHandle = await createAvailablePublicHandle(
        transaction,
        project.slug
      );
      const settings = await transactionRepository.create({
        tenantContext: context,
        projectId,
        publicHandle
      });

      if (settings === null) {
        throw projectNotFoundError();
      }

      return settings;
    });
  }

  private async getSiteSettingsSnapshot(
    context: TenantContext,
    projectId: string
  ): Promise<SiteSettingsSnapshotJson> {
    const project = await this.getProjectOrThrow(context, projectId);
    const settings = await new ProjectSiteSettingsRepository(
      this.client
    ).getOrCreateDefault(context, projectId, project.name);

    if (settings === null) {
      throw projectNotFoundError();
    }

    return toSiteSettingsSnapshotJson(settings);
  }

  private async getProjectOrThrow(
    context: TenantContext,
    projectId: string
  ) {
    const project = await new ProjectRepository(this.client).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      throw projectNotFoundError();
    }

    return project;
  }

  private async getPageOrThrow(
    context: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage> {
    const page = await new SitePageRepository(this.client).findById(
      context,
      projectId,
      pageId
    );

    if (page === null) {
      throw pageNotFoundError();
    }

    return page;
  }

  private async requireIdentityWithPermission(permission: Permission) {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, permission)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission for this publication operation."
      );
    }

    return identity;
  }
}

@Injectable()
export class PublicSiteService {
  private readonly storage: MediaStorage;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {
    this.storage = new LocalMediaStorage({
      baseDirectory: this.config.media.storageDir,
      publicBaseUrl: this.config.media.publicBaseUrl
    });
  }

  async getPublishedPage(
    publicHandle: string,
    pageSlug: string
  ): Promise<PublicSitePageResponse> {
    const repository = new PublishedPageSnapshotRepository(this.client);
    const activePage = await repository.findActivePageByHandleAndSlug(
      publicHandle,
      pageSlug
    );

    if (activePage === null) {
      throw notFound(API_ERROR_CODES.pageNotPublished, "Published page was not found.");
    }

    return this.toPublicSitePageResponse(publicHandle, activePage);
  }

  async getPublishedHome(publicHandle: string): Promise<PublicSitePageResponse> {
    const activePage = await new PublishedPageSnapshotRepository(
      this.client
    ).findActiveHomePageByHandle(publicHandle);

    if (activePage === null) {
      throw notFound(API_ERROR_CODES.pageNotPublished, "Published site was not found.");
    }

    return this.toPublicSitePageResponse(publicHandle, activePage);
  }

  async getPublicMediaContent(assetId: string): Promise<PublicMediaContent> {
    const asset = await this.client.mediaAsset.findUnique({
      where: {
        id: assetId
      }
    });

    if (asset === null || !(await this.isAssetUsedByActiveSnapshot(asset))) {
      throw notFound(API_ERROR_CODES.mediaAssetNotFound, "Media asset was not found.");
    }

    if (!(await this.storage.exists(asset.storageKey))) {
      throw notFound(API_ERROR_CODES.mediaAssetNotFound, "Media asset was not found.");
    }

    const localPath = this.storage.resolveLocalPath(asset.storageKey);

    return {
      file: new StreamableFile(createReadStream(localPath)),
      mimeType: asset.mimeType,
      cacheControl: "public, max-age=3600",
      lastModified: asset.updatedAt.toUTCString()
    };
  }

  private async toPublicSitePageResponse(
    publicHandle: string,
    activePage: {
      readonly project: {
        readonly name: string;
      };
      readonly snapshot: PublishedPageSnapshot;
    }
  ): Promise<PublicSitePageResponse> {
    const validation = validatePageDocument(activePage.snapshot.documentJson);

    if (!validation.ok) {
      throw badRequest(API_ERROR_CODES.pageDraftInvalid, "Published snapshot is invalid.");
    }

    const navigation = await new PublishedPageSnapshotRepository(
      this.client
    ).listActivePagesForNavigation(publicHandle);
    const productList = await this.getPublicProductRenderModels(publicHandle);
    const products = Object.fromEntries(
      productList.map((product) => [product.id, product])
    );

    return {
      projectName: activePage.project.name,
      pageTitle: activePage.snapshot.pageTitle,
      pageSlug: activePage.snapshot.pageSlug,
      snapshotVersion: activePage.snapshot.version,
      document: materializePublicMediaUrls(validation.document, this.config),
      publishedAt: activePage.snapshot.publishedAt.toISOString(),
      canonicalPath: createPublicPagePath(publicHandle, activePage.snapshot.pageSlug),
      navigation: navigation.map((item) => ({
        pageId: item.snapshot.pageId,
        title: item.snapshot.pageTitle,
        slug: item.snapshot.pageSlug,
        publicUrl: createPublicPageUrl(
          this.config,
          publicHandle,
          item.snapshot.pageSlug
        )
      })),
      products,
      productList,
      siteSettings: getSnapshotSiteSettings(
        activePage.snapshot,
        activePage.project.name
      )
    };
  }

  private async isAssetUsedByActiveSnapshot(asset: MediaAsset): Promise<boolean> {
    const states = await this.client.publishedPageState.findMany({
      where: {
        organizationId: asset.organizationId,
        projectId: asset.projectId,
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

    const usedBySnapshot = states.some((state) => {
      if (state.activeSnapshot === null) {
        return false;
      }

      const validation = validatePageDocument(state.activeSnapshot.documentJson);

      return (
        validation.ok &&
        collectPageDocumentImageAssetIds(validation.document).includes(asset.id)
      );
    });

    if (usedBySnapshot) {
      return true;
    }

    const productMediaUsage = await this.client.productMedia.count({
      where: {
        organizationId: asset.organizationId,
        projectId: asset.projectId,
        mediaAssetId: asset.id,
        product: {
          status: "ACTIVE",
          deletedAt: null,
          project: {
            deletedAt: null,
            publicationSettings: {
              publicHandle: {
                not: ""
              }
            }
          }
        }
      }
    });

    if (productMediaUsage > 0) {
      return true;
    }

    const legacyProductUsage = await this.client.product.count({
      where: {
        organizationId: asset.organizationId,
        projectId: asset.projectId,
        primaryMediaAssetId: asset.id,
        status: "ACTIVE",
        deletedAt: null,
        media: {
          none: {}
        },
        project: {
          deletedAt: null,
          publicationSettings: {
            publicHandle: {
              not: ""
            }
          }
        }
      }
    });

    return legacyProductUsage > 0;
  }

  private async getPublicProductRenderModels(
    publicHandle: string
  ): Promise<readonly PublicProductRenderModel[]> {
    const products = await new ProductRepository(
      this.client
    ).listActivePublicByHandle(publicHandle);

    return Promise.all(
      products.map((product) => this.toPublicProductRenderModel(publicHandle, product))
    );
  }

  private async toPublicProductRenderModel(
    publicHandle: string,
    product: ProductWithPrimaryMedia
  ): Promise<PublicProductRenderModel> {
    const defaultVariant = await this.client.productVariant.findFirst({
      where: {
        organizationId: product.organizationId,
        projectId: product.projectId,
        productId: product.id,
        deletedAt: null,
        isDefault: true
      }
    });
    const publicContext = {
      organizationId: product.organizationId,
      userId: "public",
      membershipId: "public",
      role: "VIEWER"
    } as const;
    const images = await new ProductMediaRepository(this.client).listByProduct(
      publicContext,
      product.projectId,
      product.id
    );
    const imageResponses = images.map((image) => ({
      id: image.id,
      url: createPublicMediaUrl(this.config, image.mediaAsset.id),
      altText: image.mediaAsset.altText,
      width: image.mediaAsset.width,
      height: image.mediaAsset.height,
      position: image.position,
      isPrimary: image.isPrimary
    }));
    const compatibilityPrimary =
      imageResponses.length > 0 || product.primaryMediaAsset === null
        ? null
        : {
            url: createPublicMediaUrl(this.config, product.primaryMediaAsset.id),
            altText: product.primaryMediaAsset.altText
          };

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      shortDescription: product.shortDescription,
      primaryImage:
        imageResponses.find((image) => image.isPrimary) ??
        imageResponses[0] ??
        compatibilityPrimary,
      images: imageResponses,
      price: defaultVariant === null ? null : toPublicProductMoney(defaultVariant),
      availability:
        defaultVariant === null
          ? "out-of-stock"
          : getProductAvailability(defaultVariant),
      publicUrl: createPublicProductPath(publicHandle, product.slug)
    };
  }
}

export function createPublicPagePath(
  publicHandle: string,
  pageSlug?: string
): string {
  return pageSlug === undefined
    ? `/s/${encodeURIComponent(publicHandle)}`
    : `/s/${encodeURIComponent(publicHandle)}/${encodeURIComponent(pageSlug)}`;
}

export function createPublicProductPath(
  publicHandle: string,
  productSlug?: string
): string {
  const basePath = `/s/${encodeURIComponent(publicHandle)}/products`;

  return productSlug === undefined
    ? basePath
    : `${basePath}/${encodeURIComponent(productSlug)}`;
}

export function createPublicPageUrl(
  config: AppConfig,
  publicHandle: string,
  pageSlug?: string
): string {
  return `${config.web.publicStorefrontUrl.replace(/\/$/, "")}${createPublicPagePath(
    publicHandle,
    pageSlug
  )}`;
}

function toPublicProductMoney(variant: ProductVariant) {
  const money = {
    amountMinor: variant.priceMinor,
    currency: "RUB" as const
  };

  return {
    ...money,
    formatted: formatRubMoney(money)
  };
}

export function createPublicMediaUrl(config: AppConfig, assetId: string): string {
  return `${config.web.publicApiUrl.replace(
    /\/$/,
    ""
  )}/api/public/media/${encodeURIComponent(assetId)}/content`;
}

function materializePublicMediaUrls(
  document: PageDocumentV2,
  config: AppConfig
): PageDocumentV2 {
  return {
    ...document,
    root: {
      ...document.root,
      children: document.root.children.map((section) =>
        materializeSection(section, config)
      )
    }
  };
}

function materializeSection(
  section: SectionNode,
  config: AppConfig
): SectionNode {
  return {
    ...section,
    children: section.children.map((child) =>
      child.type === "column"
        ? materializeColumn(child, config)
        : materializeBlock(child, config)
    )
  };
}

function materializeColumn(column: ColumnNode, config: AppConfig): ColumnNode {
  return {
    ...column,
    children: column.children.map((block) => materializeBlock(block, config))
  };
}

function materializeBlock(block: BlockNode, config: AppConfig): BlockNode {
  return block.type === "image" && block.props.assetId !== undefined
    ? {
        ...block,
        props: {
          ...block.props,
          src: createPublicMediaUrl(config, block.props.assetId)
        }
      }
    : block;
}

function getSnapshotSiteSettings(
  snapshot: PublishedPageSnapshot,
  projectName: string
): SiteSettingsSnapshotJson {
  if (isSiteSettingsSnapshotJson(snapshot.siteSettingsJson)) {
    return snapshot.siteSettingsJson;
  }

  return {
    headerEnabled: true,
    footerEnabled: true,
    header: createDefaultHeaderDraft(projectName),
    footer: createDefaultFooterDraft(projectName),
    revision: 0
  };
}

function getSnapshotSiteSettingsRevision(snapshot: PublishedPageSnapshot): number {
  return isSiteSettingsSnapshotJson(snapshot.siteSettingsJson)
    ? snapshot.siteSettingsJson.revision
    : 0;
}

function isSiteSettingsSnapshotJson(
  value: unknown
): value is SiteSettingsSnapshotJson {
  return (
    isRecord(value) &&
    typeof value.headerEnabled === "boolean" &&
    typeof value.footerEnabled === "boolean" &&
    isRecord(value.header) &&
    isRecord(value.footer) &&
    typeof value.revision === "number"
  );
}

function parsePublishPayload(body: unknown): {
  readonly expectedRevision: number;
} {
  if (!isRecord(body) || typeof body.expectedRevision !== "number") {
    throw badRequest(API_ERROR_CODES.validationFailed, "Publish payload is invalid.", [
      {
        field: "expectedRevision",
        code: "FIELD_REQUIRED",
        message: "expectedRevision is required."
      }
    ]);
  }

  return {
    expectedRevision: body.expectedRevision
  };
}

function parsePublicHandlePayload(body: unknown): string {
  if (!isRecord(body) || typeof body.publicHandle !== "string") {
    throw badRequest(API_ERROR_CODES.validationFailed, "Publication settings payload is invalid.", [
      {
        field: "publicHandle",
        code: "FIELD_REQUIRED",
        message: "publicHandle is required."
      }
    ]);
  }

  const result = validatePublicHandle(body.publicHandle);

  if (!result.ok) {
    throw badRequest(toPublicHandleErrorCode(result.code), "Public handle is invalid.", [
      {
        field: "publicHandle",
        code: result.code,
        message: `Public handle is invalid: ${result.code}.`
      }
    ]);
  }

  return result.value;
}

function toPublicationSettingsResponse(
  publicHandle: string,
  config: AppConfig
): PublicationSettingsResponse {
  const basePublicUrl = config.web.publicStorefrontUrl.replace(/\/$/, "");

  return {
    publicHandle,
    basePublicUrl,
    projectPublicUrl: createPublicPageUrl(config, publicHandle),
    constraints: {
      minLength: 3,
      maxLength: 48,
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      reserved: RESERVED_PUBLIC_HANDLES
    }
  };
}

async function createAvailablePublicHandle(
  client: RepositoryPrismaClient,
  preferredHandle: string
): Promise<string> {
  const baseResult = validatePublicHandle(preferredHandle);
  const base = baseResult.ok ? baseResult.value : "site";

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await client.projectPublicationSettings.findUnique({
      where: {
        publicHandle: candidate
      }
    });

    if (existing === null) {
      return candidate;
    }
  }

  throw conflict(
    API_ERROR_CODES.publicHandleConflict,
    "Could not allocate public handle."
  );
}

function toPublicHandleErrorCode(code: string) {
  return code === DOMAIN_ERROR_CODES.publicHandleReserved
    ? API_ERROR_CODES.publicHandleReserved
    : API_ERROR_CODES.publicHandleInvalid;
}

function projectNotFoundError() {
  return notFound(API_ERROR_CODES.projectNotFound, "Project was not found.");
}

function pageNotFoundError() {
  return notFound(API_ERROR_CODES.pageNotFound, "Project page was not found.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueConstraintError(error: unknown): boolean {
  return isRecord(error) && error.code === "P2002";
}
