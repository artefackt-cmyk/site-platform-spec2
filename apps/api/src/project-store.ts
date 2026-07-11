import { Inject, Injectable } from "@nestjs/common";
import {
  AuditLogRepository,
  ProjectRepository,
  SitePageRepository,
  type DatabasePrismaClient,
  type Project,
  type SitePage
} from "@site-platform/database";
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
