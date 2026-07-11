import type { TenantContext } from "@site-platform/domain";
import type { Project, ProjectStatus } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type CreateProjectInput = {
  readonly organizationId: string;
  readonly name: string;
  readonly slug: string;
  readonly status?: ProjectStatus;
};

export type ProjectTenantLookupInput = {
  readonly organizationId: string;
  readonly projectId: string;
};

export type ProjectTenantSlugLookupInput = {
  readonly organizationId: string;
  readonly slug: string;
};

export type UpdateProjectSettingsInput = ProjectTenantLookupInput & {
  readonly name?: string;
  readonly slug?: string;
  readonly status?: ProjectStatus;
};

export class ProjectRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateProjectInput): Promise<Project> {
    return this.client.project.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        ...(input.status === undefined ? {} : { status: input.status })
      }
    });
  }

  async findByOrganizationAndId(
    input: ProjectTenantLookupInput
  ): Promise<Project | null> {
    return this.client.project.findFirst({
      where: {
        id: input.projectId,
        organizationId: input.organizationId,
        deletedAt: null
      }
    });
  }

  async findByTenantContextAndId(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
  }): Promise<Project | null> {
    return this.findByOrganizationAndId({
      organizationId: input.tenantContext.organizationId,
      projectId: input.projectId
    });
  }

  async findByOrganizationAndSlug(
    input: ProjectTenantSlugLookupInput
  ): Promise<Project | null> {
    return this.client.project.findFirst({
      where: {
        organizationId: input.organizationId,
        slug: input.slug,
        deletedAt: null
      }
    });
  }

  async listByOrganization(organizationId: string): Promise<readonly Project[]> {
    return this.client.project.findMany({
      where: {
        organizationId,
        deletedAt: null
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async updateSettings(
    input: UpdateProjectSettingsInput
  ): Promise<Project | null> {
    const result = await this.client.project.updateMany({
      where: {
        id: input.projectId,
        organizationId: input.organizationId,
        deletedAt: null
      },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.slug === undefined ? {} : { slug: input.slug }),
        ...(input.status === undefined ? {} : { status: input.status })
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByOrganizationAndId(input);
  }

  async softDelete(input: ProjectTenantLookupInput): Promise<Project | null> {
    const result = await this.client.project.updateMany({
      where: {
        id: input.projectId,
        organizationId: input.organizationId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.client.project.findFirst({
      where: {
        id: input.projectId,
        organizationId: input.organizationId
      }
    });
  }
}
