import { Inject, Injectable } from "@nestjs/common";
import {
  AuditLogRepository,
  PageDocumentRepository,
  ProjectRepository,
  SitePageRepository,
  type DatabasePrismaClient,
  type PageDocumentRecord,
  type Project,
  type SitePage
} from "@site-platform/database";
import type { PageDocumentV1 } from "@site-platform/editor-core";
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
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type SavePageDocumentInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly pageId: string;
  readonly document: PageDocumentV1;
  readonly expectedRevision: number;
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
  readonly findPageById: (
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ) => Promise<SitePage | null>;
  readonly createPageWithAudit: (
    input: CreateProjectPageInput
  ) => Promise<SitePage | null>;
  readonly getOrCreatePageDocument: (
    tenantContext: TenantContext,
    projectId: string,
    pageId: string
  ) => Promise<PageDocumentRecord | null>;
  readonly savePageDocumentWithAudit: (
    input: SavePageDocumentInput
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

      const page = await sitePageRepository.create(
        input.tenantContext,
        input.projectId,
        {
          title: input.title,
          slug: input.slug,
          status: "DRAFT",
          isHome: input.isHome
        }
      );

      if (page === null) {
        return null;
      }

      await auditLogRepository.create({
        organizationId: input.tenantContext.organizationId,
        actorUserId: input.tenantContext.userId,
        action: "page.created",
        entityType: "SitePage",
        entityId: page.id,
        metadata: {
          projectId: input.projectId,
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
        action: "page.document.updated",
        entityType: "PageDocument",
        entityId: pageDocument.id,
        metadata: {
          projectId: input.projectId,
          pageId: input.pageId,
          revision: pageDocument.revision
        }
      });

      return pageDocument;
    });
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
