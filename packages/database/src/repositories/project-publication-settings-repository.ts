import type { TenantContext } from "@site-platform/domain";
import type { Project, ProjectPublicationSettings } from "@prisma/client";
import { ProjectRepository } from "./project-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateProjectPublicationSettingsInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly publicHandle: string;
};

export type UpdateProjectPublicationSettingsInput =
  CreateProjectPublicationSettingsInput;

export type PublicProjectLookup = {
  readonly settings: ProjectPublicationSettings;
  readonly project: Project;
};

export class ProjectPublicationSettingsRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async findByProject(
    context: TenantContext,
    projectId: string
  ): Promise<ProjectPublicationSettings | null> {
    return this.client.projectPublicationSettings.findFirst({
      where: {
        organizationId: context.organizationId,
        projectId,
        project: {
          organizationId: context.organizationId,
          deletedAt: null
        }
      }
    });
  }

  async create(
    input: CreateProjectPublicationSettingsInput
  ): Promise<ProjectPublicationSettings | null> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: input.tenantContext,
      projectId: input.projectId
    });

    if (project === null) {
      return null;
    }

    return this.client.projectPublicationSettings.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        publicHandle: input.publicHandle
      }
    });
  }

  async getOrCreate(
    input: CreateProjectPublicationSettingsInput
  ): Promise<ProjectPublicationSettings | null> {
    const existingSettings = await this.findByProject(
      input.tenantContext,
      input.projectId
    );

    if (existingSettings !== null) {
      return existingSettings;
    }

    return this.create(input);
  }

  async updateHandle(
    input: UpdateProjectPublicationSettingsInput
  ): Promise<ProjectPublicationSettings | null> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: input.tenantContext,
      projectId: input.projectId
    });

    if (project === null) {
      return null;
    }

    const result = await this.client.projectPublicationSettings.updateMany({
      where: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId
      },
      data: {
        publicHandle: input.publicHandle
      }
    });

    if (result.count === 0) {
      return this.create(input);
    }

    return this.findByProject(input.tenantContext, input.projectId);
  }

  async findProjectByPublicHandle(
    publicHandle: string
  ): Promise<PublicProjectLookup | null> {
    const settings = await this.client.projectPublicationSettings.findFirst({
      where: {
        publicHandle,
        project: {
          deletedAt: null
        }
      },
      include: {
        project: true
      }
    });

    return settings === null
      ? null
      : {
          settings,
          project: settings.project
        };
  }
}
