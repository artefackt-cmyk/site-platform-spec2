import { Inject, Injectable } from "@nestjs/common";
import {
  AuditLogRepository,
  ProjectRepository,
  type DatabasePrismaClient,
  type Project
} from "@site-platform/database";
import type { TenantContext } from "@site-platform/domain";
import { DATABASE_CLIENT } from "./database.provider";

export type CreateDraftProjectInput = {
  readonly tenantContext: TenantContext;
  readonly name: string;
  readonly slug: string;
};

export type ProjectStore = {
  readonly listByTenant: (
    tenantContext: TenantContext
  ) => Promise<readonly Project[]>;
  readonly findByTenantAndSlug: (
    tenantContext: TenantContext,
    slug: string
  ) => Promise<Project | null>;
  readonly createDraftWithAudit: (
    input: CreateDraftProjectInput
  ) => Promise<Project>;
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
}

export function isProjectSlugUniqueError(error: unknown): boolean {
  return isRecord(error) && error.code === "P2002";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
