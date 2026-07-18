import { Inject, Injectable } from "@nestjs/common";
import {
  AuditLogRepository,
  MediaAssetRepository,
  PageDocumentRepository,
  ProjectRepository,
  ProjectSiteSettingsRepository,
  SiteRepository,
  SitePageRepository,
  type DatabasePrismaClient,
  type MediaAsset,
  type PageDocumentRecord,
  type Project,
  type Site,
  type SitePage
} from "@site-platform/database";
import type { PageDocumentV2 } from "@site-platform/editor-core";
import type { TenantContext } from "@site-platform/domain";
import { DATABASE_CLIENT } from "./database.provider";

export type CreateDraftProjectInput = {
  readonly tenantContext: TenantContext;
  readonly name: string;
  readonly slug: string;
};

export type CreateProjectPageInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId?: string;
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type UpdateProjectPageInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId?: string;
  readonly pageId: string;
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type CreateProjectSiteInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly name: string;
  readonly slug: string;
  readonly isDefault: boolean;
};

export type UpdateProjectSiteInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId: string;
  readonly name?: string;
  readonly slug?: string;
};

export type SavePageDocumentInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly pageId: string;
  readonly document: PageDocumentV2;
  readonly expectedRevision: number;
  readonly auditAction?: string;
  readonly auditMetadata?: Record<string, unknown>;
};

export type ProjectStore = {
  readonly listByTenant: (
    tenantContext: TenantContext
  ) => Promise<readonly Project[]>;
  readonly findByTenantAndId: (
    tenantContext: TenantContext,
    projectId: string
  ) => Promise<Project | null>;
  readonly findByTenantAndSlug: (
    tenantContext: TenantContext,
    slug: string
  ) => Promise<Project | null>;
  readonly createDraftWithAudit: (
    input: CreateDraftProjectInput
  ) => Promise<Project>;
  readonly listPagesByProject: (
    tenantContext: TenantContext,
    projectId: string
  ) => Promise<readonly SitePage[]>;
  readonly listSitesByProject: (
    tenantContext: TenantContext,
    projectId: string
  ) => Promise<readonly Site[]>;
  readonly findSiteById: (
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ) => Promise<Site | null>;
  readonly createSiteWithAudit: (
    input: CreateProjectSiteInput
  ) => Promise<Site | null>;
  readonly updateSiteWithAudit: (
    input: UpdateProjectSiteInput
  ) => Promise<Site | null>;
  readonly archiveSiteWithAudit: (
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ) => Promise<Site | null>;
  readonly setDefaultSiteWithAudit: (
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ) => Promise<Site | null>;
  readonly listPagesBySite: (
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ) => Promise<readonly SitePage[]>;
  readonly findPageById: (
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ) => Promise<SitePage | null>;
  readonly findPageByIdForSite: (
    tenantContext: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ) => Promise<SitePage | null>;
  readonly createPageWithAudit: (
    input: CreateProjectPageInput
  ) => Promise<SitePage | null>;
  readonly updatePageWithAudit: (
    input: UpdateProjectPageInput
  ) => Promise<SitePage | null>;
  readonly getOrCreatePageDocument: (
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ) => Promise<PageDocumentRecord | null>;
  readonly getOrCreatePageDocumentForSite: (
    tenantContext: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ) => Promise<PageDocumentRecord | null>;
  readonly findMediaAssetById: (
    tenantContext: TenantContext,
    projectId: string,
    assetId: string
  ) => Promise<MediaAsset | null>;
  readonly savePageDocumentWithAudit: (
    input: SavePageDocumentInput
  ) => Promise<PageDocumentRecord | null>;
  readonly savePageDocumentForSiteWithAudit: (
    input: SavePageDocumentInput & { readonly siteId: string }
  ) => Promise<PageDocumentRecord | null>;
};

export const PROJECT_STORE = Symbol("PROJECT_STORE");

@Injectable()
export class PrismaProjectStore implements ProjectStore {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient
  ) {}

  async listByTenant(tenantContext: TenantContext): Promise<readonly Project[]> {
    return new ProjectRepository(this.client).listByOrganization(
      tenantContext.organizationId
    );
  }

  async findByTenantAndId(
    tenantContext: TenantContext,
    projectId: string
  ): Promise<Project | null> {
    return new ProjectRepository(this.client).findByTenantContextAndId({
      tenantContext,
      projectId
    });
  }

  async findByTenantAndSlug(
    tenantContext: TenantContext,
    slug: string
  ): Promise<Project | null> {
    return new ProjectRepository(this.client).findByOrganizationAndSlug({
      organizationId: tenantContext.organizationId,
      slug
    });
  }

  async createDraftWithAudit(input: CreateDraftProjectInput): Promise<Project> {
    return this.client.$transaction(async (transaction) => {
      const projectRepository = new ProjectRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const project = await projectRepository.create({
        organizationId: input.tenantContext.organizationId,
        name: input.name,
        slug: input.slug,
        status: "DRAFT"
      });

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: "project.created",
        entityType: "Project",
        entityId: project.id,
        metadata: {
          name: project.name,
          slug: project.slug
        }
      });

      return project;
    });
  }

  async listPagesByProject(
    tenantContext: TenantContext,
    projectId: string
  ): Promise<readonly SitePage[]> {
    return new SitePageRepository(this.client).listByProject(
      tenantContext,
      projectId
    );
  }

  async listSitesByProject(
    tenantContext: TenantContext,
    projectId: string
  ): Promise<readonly Site[]> {
    return new SiteRepository(this.client).listAllByProject(
      tenantContext,
      projectId
    );
  }

  async findSiteById(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    return new SiteRepository(this.client).findById(
      tenantContext,
      projectId,
      siteId
    );
  }

  async createSiteWithAudit(input: CreateProjectSiteInput): Promise<Site | null> {
    return this.client.$transaction(async (transaction) => {
      const siteRepository = new SiteRepository(transaction);
      const siteSettingsRepository = new ProjectSiteSettingsRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const site = await siteRepository.create({
        tenantContext: input.tenantContext,
        projectId: input.projectId,
        name: input.name,
        slug: input.slug,
        isDefault: input.isDefault
      });

      if (site === null) {
        return null;
      }

      await siteSettingsRepository.getOrCreateDefaultForSite(
        input.tenantContext,
        input.projectId,
        site.id,
        site.name
      );

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: "site.created",
        entityType: "Site",
        entityId: site.id,
        metadata: {
          projectId: input.projectId,
          slug: site.slug,
          isDefault: site.isDefault
        }
      });

      return site;
    });
  }

  async updateSiteWithAudit(input: UpdateProjectSiteInput): Promise<Site | null> {
    return this.client.$transaction(async (transaction) => {
      const siteRepository = new SiteRepository(transaction);
      const projectRepository = new ProjectRepository(transaction);
      const siteSettingsRepository = new ProjectSiteSettingsRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const existingSite = await siteRepository.findById(
        input.tenantContext,
        input.projectId,
        input.siteId
      );

      if (existingSite === null) {
        return null;
      }

      const site = await siteRepository.update(input);

      if (site === null) {
        return null;
      }

      if (input.name !== undefined && input.name !== existingSite.name) {
        const project = await projectRepository.findByTenantContextAndId({
          tenantContext: input.tenantContext,
          projectId: input.projectId
        });

        if (project !== null) {
          await siteSettingsRepository.syncGeneratedBrandForSiteRename({
            tenantContext: input.tenantContext,
            projectId: input.projectId,
            siteId: site.id,
            previousSiteName: existingSite.name,
            nextSiteName: site.name,
            projectName: project.name
          });
        }
      }

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: "site.updated",
        entityType: "Site",
        entityId: site.id,
        metadata: {
          projectId: input.projectId,
          name: site.name,
          slug: site.slug
        }
      });

      return site;
    });
  }

  async archiveSiteWithAudit(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    return this.client.$transaction(async (transaction) => {
      const siteRepository = new SiteRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const site = await siteRepository.archive(tenantContext, projectId, siteId);

      if (site === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: tenantContext.organizationId,
        actorUserId: tenantContext.userId,
        action: "site.archived",
        entityType: "Site",
        entityId: site.id,
        metadata: {
          projectId
        }
      });

      return site;
    });
  }

  async setDefaultSiteWithAudit(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<Site | null> {
    return this.client.$transaction(async (transaction) => {
      const siteRepository = new SiteRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const site = await siteRepository.setDefault(tenantContext, projectId, siteId);

      if (site === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: tenantContext.organizationId,
        actorUserId: tenantContext.userId,
        action: "site.default.changed",
        entityType: "Site",
        entityId: site.id,
        metadata: {
          projectId
        }
      });

      return site;
    });
  }

  async listPagesBySite(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<readonly SitePage[]> {
    return new SitePageRepository(this.client).listBySite(
      tenantContext,
      projectId,
      siteId
    );
  }

  async findPageById(
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    return new SitePageRepository(this.client).findById(
      tenantContext,
      projectId,
      pageId
    );
  }

  async findPageByIdForSite(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<SitePage | null> {
    return new SitePageRepository(this.client).findByIdForSite(
      tenantContext,
      projectId,
      siteId,
      pageId
    );
  }

  async createPageWithAudit(
    input: CreateProjectPageInput
  ): Promise<SitePage | null> {
    return this.client.$transaction(async (transaction) => {
      const projectRepository = new ProjectRepository(transaction);
      const sitePageRepository = new SitePageRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const project = await projectRepository.findByTenantContextAndId({
        tenantContext: input.tenantContext,
        projectId: input.projectId
      });

      if (project === null) {
        return null;
      }

      const scopedPage =
        input.siteId === undefined
          ? await sitePageRepository.create(input.tenantContext, input.projectId, {
              title: input.title,
              slug: input.slug,
              status: "DRAFT",
              isHome: input.isHome
            })
          : await sitePageRepository.createForSite(
              input.tenantContext,
              input.projectId,
              input.siteId,
              {
                title: input.title,
                slug: input.slug,
                status: "DRAFT",
                isHome: input.isHome
              }
            );

      if (scopedPage === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: "page.created",
        entityType: "SitePage",
        entityId: scopedPage.id,
        metadata: {
          projectId: input.projectId,
          siteId: scopedPage.siteId,
          title: scopedPage.title,
          slug: scopedPage.slug,
          isHome: scopedPage.isHome
        }
      });

      return scopedPage;
    });
  }

  async updatePageWithAudit(
    input: UpdateProjectPageInput
  ): Promise<SitePage | null> {
    return this.client.$transaction(async (transaction) => {
      const sitePageRepository = new SitePageRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const page =
        input.siteId === undefined
          ? await sitePageRepository.updateSettings(
              input.tenantContext,
              input.projectId,
              input.pageId,
              {
                title: input.title,
                slug: input.slug,
                isHome: input.isHome
              }
            )
          : await sitePageRepository.updateSettingsForSite(
              input.tenantContext,
              input.projectId,
              input.siteId,
              input.pageId,
              {
                title: input.title,
                slug: input.slug,
                isHome: input.isHome
              }
            );

      if (page === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: "page.settings.updated",
        entityType: "SitePage",
        entityId: page.id,
        metadata: {
          projectId: input.projectId,
          siteId: page.siteId,
          title: page.title,
          slug: page.slug,
          isHome: page.isHome
        }
      });

      return page;
    });
  }

  async getOrCreatePageDocument(
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const pageDocumentRepository = new PageDocumentRepository(this.client);
    const pageDocument = await pageDocumentRepository.findByPage(
      tenantContext,
      projectId,
      pageId
    );

    if (pageDocument !== null) {
      return pageDocument;
    }

    return pageDocumentRepository.createDefault(tenantContext, projectId, pageId);
  }

  async getOrCreatePageDocumentForSite(
    tenantContext: TenantContext,
    projectId: string,
    siteId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const pageDocumentRepository = new PageDocumentRepository(this.client);
    const pageDocument = await pageDocumentRepository.findByPageForSite(
      tenantContext,
      projectId,
      siteId,
      pageId
    );

    if (pageDocument !== null) {
      return pageDocument;
    }

    return pageDocumentRepository.createDefaultForSite(
      tenantContext,
      projectId,
      siteId,
      pageId
    );
  }

  async savePageDocumentWithAudit(
    input: SavePageDocumentInput
  ): Promise<PageDocumentRecord | null> {
    return this.client.$transaction(async (transaction) => {
      const pageDocumentRepository = new PageDocumentRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const pageDocument = await pageDocumentRepository.save(
        input.tenantContext,
        input.projectId,
        input.pageId,
        input.document,
        input.expectedRevision
      );

      if (pageDocument === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: input.auditAction ?? "page.document.updated",
        entityType: "PageDocument",
        entityId: pageDocument.id,
        metadata: {
          projectId: input.projectId,
          pageId: input.pageId,
          revision: pageDocument.revision,
          ...(input.auditMetadata ?? {})
        }
      });

      return pageDocument;
    });
  }

  async savePageDocumentForSiteWithAudit(
    input: SavePageDocumentInput & { readonly siteId: string }
  ): Promise<PageDocumentRecord | null> {
    return this.client.$transaction(async (transaction) => {
      const pageDocumentRepository = new PageDocumentRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const pageDocument = await pageDocumentRepository.saveForSite(
        input.tenantContext,
        input.projectId,
        input.siteId,
        input.pageId,
        input.document,
        input.expectedRevision
      );

      if (pageDocument === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: input.auditAction ?? "page.document.updated",
        entityType: "PageDocument",
        entityId: pageDocument.id,
        metadata: {
          projectId: input.projectId,
          siteId: input.siteId,
          pageId: input.pageId,
          revision: pageDocument.revision,
          ...(input.auditMetadata ?? {})
        }
      });

      return pageDocument;
    });
  }

  async findMediaAssetById(
    tenantContext: TenantContext,
    projectId: string,
    assetId: string
  ): Promise<MediaAsset | null> {
    return new MediaAssetRepository(this.client).findByIdForProject(
      tenantContext,
      projectId,
      assetId
    );
  }
}

export function isProjectSlugUniqueError(error: unknown): boolean {
  return isRecord(error) && error.code === "P2002";
}

export function isPageSlugUniqueError(error: unknown): boolean {
  return isRecord(error) && error.code === "P2002";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
