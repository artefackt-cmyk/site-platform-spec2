import type { TenantContext } from "@site-platform/domain";
import type { ProjectSiteSettings } from "@prisma/client";
import type { PrismaJsonInput, RepositoryPrismaClient } from "../types";
import { ProjectRepository } from "./project-repository";

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
    return this.client.projectSiteSettings.findFirst({
      where: siteSettingsScope(context, projectId)
    });
  }

  async getOrCreateDefault(
    context: TenantContext,
    projectId: string,
    projectName: string
  ): Promise<ProjectSiteSettings | null> {
    const existing = await this.findByProject(context, projectId);

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
    const existing = await this.findByProject(
      input.tenantContext,
      input.projectId
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

function siteSettingsScope(context: TenantContext, projectId: string) {
  return {
    organizationId: context.organizationId,
    projectId,
    project: {
      organizationId: context.organizationId,
      deletedAt: null
    }
  };
}

function toJson(value: SiteHeaderDraftJson | SiteFooterDraftJson): PrismaJsonInput {
  return value as unknown as PrismaJsonInput;
}
