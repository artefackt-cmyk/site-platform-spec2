import type { TenantContext } from "@site-platform/domain";
import type { ProjectSiteSettings } from "@prisma/client";
import type { PrismaJsonInput, RepositoryPrismaClient } from "../types";
import { ProjectRepository } from "./project-repository";
import { SiteRepository } from "./site-repository";

export type SiteHeaderDraftJson = {
  readonly brandText: string;
  readonly logoUrl: string;
  readonly navigation: readonly {
    readonly label: string;
    readonly type: "page" | "external";
    readonly pageId?: string | undefined;
    readonly url?: string | undefined;
  }[];
  readonly cartLinkEnabled: boolean;
  readonly ctaLabel: string;
  readonly ctaUrl: string;
};

export type SiteFooterDraftJson = {
  readonly brandText: string;
  readonly description: string;
  readonly email: string;
  readonly phone: string;
  readonly legalText: string;
  readonly copyrightText: string;
};

export type SiteSettingsSnapshotJson = {
  readonly headerEnabled: boolean;
  readonly footerEnabled: boolean;
  readonly header: SiteHeaderDraftJson;
  readonly footer: SiteFooterDraftJson;
  readonly revision: number;
};

export type UpdateProjectSiteSettingsDraftInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId?: string;
  readonly headerEnabled: boolean;
  readonly footerEnabled: boolean;
  readonly headerDraft: SiteHeaderDraftJson;
  readonly footerDraft: SiteFooterDraftJson;
};

export class ProjectSiteSettingsRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async findByProject(
    context: TenantContext,
    projectId: string
  ): Promise<ProjectSiteSettings | null> {
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
  ): Promise<ProjectSiteSettings | null> {
    return this.client.projectSiteSettings.findFirst({
      where: siteSettingsScope(context, projectId, siteId)
    });
  }

  async getOrCreateDefault(
    context: TenantContext,
    projectId: string,
    siteIdOrProjectName: string,
    projectNameOrUndefined?: string
  ): Promise<ProjectSiteSettings | null> {
    const site =
      projectNameOrUndefined === undefined
        ? await new SiteRepository(this.client).findDefaultOrCreate(context, projectId)
        : await new SiteRepository(this.client).findById(
            context,
            projectId,
            siteIdOrProjectName
          );
    const projectName =
      projectNameOrUndefined === undefined
        ? siteIdOrProjectName
        : projectNameOrUndefined;

    if (site === null || site.status !== "ACTIVE") {
      return null;
    }

    return this.getOrCreateDefaultForSite(context, projectId, site.id, projectName);
  }

  async getOrCreateDefaultForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    projectName: string
  ): Promise<ProjectSiteSettings | null> {
    const existing = await this.findBySite(context, projectId, siteId);

    if (existing !== null) {
      return existing;
    }

    const project = await new ProjectRepository(this.client).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      return null;
    }

    return this.client.projectSiteSettings.create({
      data: {
        organizationId: context.organizationId,
        projectId,
        siteId,
        headerDraft: toJson(createDefaultHeaderDraft(projectName)),
        footerDraft: toJson(createDefaultFooterDraft(projectName)),
        headerEnabled: true,
        footerEnabled: true,
        revision: 1
      }
    });
  }

  async updateDraft(
    input: UpdateProjectSiteSettingsDraftInput
  ): Promise<ProjectSiteSettings | null> {
    const existing =
      input.siteId === undefined
        ? await this.findByProject(input.tenantContext, input.projectId)
        : await this.findBySite(
            input.tenantContext,
            input.projectId,
            input.siteId
          );

    if (existing === null) {
      return null;
    }

    return this.client.projectSiteSettings.update({
      where: {
        id: existing.id
      },
      data: {
        headerDraft: toJson(input.headerDraft),
        footerDraft: toJson(input.footerDraft),
        headerEnabled: input.headerEnabled,
        footerEnabled: input.footerEnabled,
        revision: {
          increment: 1
        }
      }
    });
  }
}

export function createDefaultHeaderDraft(
  projectName: string
): SiteHeaderDraftJson {
  return {
    brandText: projectName,
    logoUrl: "",
    navigation: [],
    cartLinkEnabled: true,
    ctaLabel: "",
    ctaUrl: ""
  };
}

export function createDefaultFooterDraft(
  projectName: string
): SiteFooterDraftJson {
  return {
    brandText: projectName,
    description: "",
    email: "",
    phone: "",
    legalText: "",
    copyrightText: `© ${new Date().getFullYear()} ${projectName}`
  };
}

export function toSiteSettingsSnapshotJson(
  settings: ProjectSiteSettings
): SiteSettingsSnapshotJson {
  return {
    headerEnabled: settings.headerEnabled,
    footerEnabled: settings.footerEnabled,
    header: settings.headerDraft as unknown as SiteHeaderDraftJson,
    footer: settings.footerDraft as unknown as SiteFooterDraftJson,
    revision: settings.revision
  };
}

function siteSettingsScope(
  context: TenantContext,
  projectId: string,
  siteId: string
) {
  return {
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
      id: siteId,
      status: "ACTIVE" as const
    }
  };
}

function toJson(value: SiteHeaderDraftJson | SiteFooterDraftJson): PrismaJsonInput {
  return value as unknown as PrismaJsonInput;
}
