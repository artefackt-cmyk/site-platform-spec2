import type { TenantContext } from "@site-platform/domain";
import type { Project, ProjectPublicationSettings, Site } from "@prisma/client";
import { ProjectRepository } from "./project-repository";
import { SiteRepository } from "./site-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateProjectPublicationSettingsInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId?: string;
  readonly publicHandle: string;
};

export type UpdateProjectPublicationSettingsInput =
  CreateProjectPublicationSettingsInput;

export type PublicProjectLookup = {
  readonly settings: ProjectPublicationSettings;
  readonly project: Project;
  readonly site: Site;
};

export class ProjectPublicationSettingsRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async findByProject(
    context: TenantContext,
    projectId: string
  ): Promise<ProjectPublicationSettings | null> {
    const site = await new SiteRepository(this.client).findDefaultOrCreate(
      context,
      projectId
    );

    return site === null ? null : this.findBySite(context, projectId, site.id);
  }

  async findBySite(
    context: TenantContext,
    projectId: string,
    siteId: string
  ): Promise<ProjectPublicationSettings | null> {
    return this.client.projectPublicationSettings.findFirst({
      where: {
        organizationId: context.organizationId,
        projectId,
        siteId,
        project: {
          organizationId: context.organizationId,
          deletedAt: null
        },
        site: {
          organizationId: context.organizationId,
          projectId,
          status: "ACTIVE"
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

    const site =
      input.siteId === undefined
        ? await new SiteRepository(this.client).findDefaultOrCreate(
            input.tenantContext,
            input.projectId
          )
        : await new SiteRepository(this.client).findById(
            input.tenantContext,
            input.projectId,
            input.siteId
          );

    if (site === null || site.status !== "ACTIVE") {
      return null;
    }

    return this.client.projectPublicationSettings.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        siteId: site.id,
        publicHandle: input.publicHandle
      }
    });
  }

  async getOrCreate(
    input: CreateProjectPublicationSettingsInput
  ): Promise<ProjectPublicationSettings | null> {
    const existingSettings =
      input.siteId === undefined
        ? await this.findByProject(input.tenantContext, input.projectId)
        : await this.findBySite(
            input.tenantContext,
            input.projectId,
            input.siteId
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
        projectId: input.projectId,
        ...(input.siteId === undefined ? {} : { siteId: input.siteId })
      },
      data: {
        publicHandle: input.publicHandle
      }
    });

    if (result.count === 0) {
      return this.create(input);
    }

    return input.siteId === undefined
      ? this.findByProject(input.tenantContext, input.projectId)
      : this.findBySite(input.tenantContext, input.projectId, input.siteId);
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
        project: true,
        site: true
      }
    });

    return settings === null
      ? null
      : {
          settings,
          project: settings.project,
          site: settings.site
        };
  }
}
