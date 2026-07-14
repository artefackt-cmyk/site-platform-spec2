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

export type SyncGeneratedSiteBrandInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId: string;
  readonly previousSiteName: string;
  readonly nextSiteName: string;
  readonly projectName: string;
};

export type HealLegacyGeneratedSiteBrandInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly siteId: string;
  readonly siteName: string;
  readonly legacyGeneratedNames: readonly string[];
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
    if (site === null || site.status !== "ACTIVE") {
      return null;
    }

    return this.getOrCreateDefaultForSite(context, projectId, site.id, site.name);
  }

  async getOrCreateDefaultForSite(
    context: TenantContext,
    projectId: string,
    siteId: string,
    siteName: string
  ): Promise<ProjectSiteSettings | null> {
    const existing = await this.findBySite(context, projectId, siteId);
    const project = await new ProjectRepository(this.client).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      return null;
    }

    if (existing !== null) {
      return this.updateGeneratedBrandFields(existing, {
        nextSiteName: siteName,
        legacyGeneratedNames: [project.name]
      });
    }

    return this.client.projectSiteSettings.create({
      data: {
        organizationId: context.organizationId,
        projectId,
        siteId,
        headerDraft: toJson(createDefaultHeaderDraft(siteName)),
        footerDraft: toJson(createDefaultFooterDraft(siteName)),
        headerEnabled: true,
        footerEnabled: true,
        revision: 1
      }
    });
  }

  async healLegacyGeneratedBrandForSite(
    input: HealLegacyGeneratedSiteBrandInput
  ): Promise<ProjectSiteSettings | null> {
    const existing = await this.findBySite(
      input.tenantContext,
      input.projectId,
      input.siteId
    );

    if (existing === null) {
      return this.getOrCreateDefaultForSite(
        input.tenantContext,
        input.projectId,
        input.siteId,
        input.siteName
      );
    }

    return this.updateGeneratedBrandFields(existing, {
      nextSiteName: input.siteName,
      legacyGeneratedNames: input.legacyGeneratedNames
    });
  }

  async syncGeneratedBrandForSiteRename(
    input: SyncGeneratedSiteBrandInput
  ): Promise<ProjectSiteSettings | null> {
    const existing = await this.findBySite(
      input.tenantContext,
      input.projectId,
      input.siteId
    );

    if (existing === null) {
      return this.getOrCreateDefaultForSite(
        input.tenantContext,
        input.projectId,
        input.siteId,
        input.nextSiteName
      );
    }

    return this.updateGeneratedBrandFields(existing, {
      nextSiteName: input.nextSiteName,
      legacyGeneratedNames: [input.previousSiteName, input.projectName]
    });
  }

  private async updateGeneratedBrandFields(
    existing: ProjectSiteSettings,
    input: {
      readonly nextSiteName: string;
      readonly legacyGeneratedNames: readonly string[];
    }
  ): Promise<ProjectSiteSettings> {
    const currentHeader = existing.headerDraft as unknown as SiteHeaderDraftJson;
    const currentFooter = existing.footerDraft as unknown as SiteFooterDraftJson;
    const nextHeaderDefault = createDefaultHeaderDraft(input.nextSiteName);
    const nextFooterDefault = createDefaultFooterDraft(input.nextSiteName);
    const legacyGeneratedNames = normalizeGeneratedNames(
      input.legacyGeneratedNames,
      input.nextSiteName
    );
    const shouldReplaceHeaderBrand = isGeneratedBrandText(
      currentHeader.brandText,
      legacyGeneratedNames
    );
    const shouldReplaceFooterBrand = isGeneratedBrandText(
      currentFooter.brandText,
      legacyGeneratedNames
    );
    const shouldReplaceCopyright = isGeneratedCopyrightText(
      currentFooter.copyrightText,
      legacyGeneratedNames
    );

    if (
      !shouldReplaceHeaderBrand &&
      !shouldReplaceFooterBrand &&
      !shouldReplaceCopyright
    ) {
      return existing;
    }

    return this.client.projectSiteSettings.update({
      where: {
        id: existing.id
      },
      data: {
        headerDraft: toJson({
          ...currentHeader,
          ...(shouldReplaceHeaderBrand
            ? { brandText: nextHeaderDefault.brandText }
            : {})
        }),
        footerDraft: toJson({
          ...currentFooter,
          ...(shouldReplaceFooterBrand
            ? { brandText: nextFooterDefault.brandText }
            : {}),
          ...(shouldReplaceCopyright
            ? { copyrightText: nextFooterDefault.copyrightText }
            : {})
        }),
        revision: {
          increment: 1
        }
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

function isGeneratedBrandText(
  value: string,
  legacyGeneratedNames: readonly string[]
): boolean {
  return legacyGeneratedNames.includes(value);
}

function isGeneratedCopyrightText(
  value: string,
  legacyGeneratedNames: readonly string[]
): boolean {
  return legacyGeneratedNames
    .map((name) => createDefaultFooterDraft(name).copyrightText)
    .includes(value);
}

function normalizeGeneratedNames(
  names: readonly string[],
  nextSiteName: string
): readonly string[] {
  return [
    ...new Set(
      names
        .map((name) => name.trim())
        .filter((name) => name !== "" && name !== nextSiteName)
    )
  ];
}
