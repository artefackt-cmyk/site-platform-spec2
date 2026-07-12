import { Inject, Injectable } from "@nestjs/common";
import {
  AuditLogRepository,
  ProjectRepository,
  ProjectSiteSettingsRepository,
  type DatabasePrismaClient,
  type SiteFooterDraftJson,
  type SiteHeaderDraftJson
} from "@site-platform/database";
import {
  PERMISSIONS,
  hasPermission,
  type TenantContext
} from "@site-platform/domain";
import {
  API_ERROR_CODES,
  badRequest,
  forbidden,
  notFound,
  type ApiValidationIssue
} from "./api-errors";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import { DATABASE_CLIENT } from "./database.provider";

export type ProjectSiteSettingsResponse = {
  readonly projectId: string;
  readonly revision: number;
  readonly headerEnabled: boolean;
  readonly footerEnabled: boolean;
  readonly header: SiteHeaderDraftJson;
  readonly footer: SiteFooterDraftJson;
};

@Injectable()
export class SiteSettingsService {
  constructor(
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver,
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient
  ) {}

  async getProjectSiteSettings(
    projectId: string
  ): Promise<ProjectSiteSettingsResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, PERMISSIONS.projectRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read project settings."
      );
    }

    const project = await this.getProjectOrThrow(identity.tenantContext, projectId);
    const settings = await new ProjectSiteSettingsRepository(
      this.client
    ).getOrCreateDefault(identity.tenantContext, projectId, project.name);

    if (settings === null) {
      throw projectNotFoundError();
    }

    return toProjectSiteSettingsResponse(settings);
  }

  async updateProjectSiteSettings(
    projectId: string,
    body: unknown
  ): Promise<ProjectSiteSettingsResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, PERMISSIONS.projectUpdate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to update project settings."
      );
    }

    const project = await this.getProjectOrThrow(identity.tenantContext, projectId);
    const repository = new ProjectSiteSettingsRepository(this.client);
    const existing = await repository.getOrCreateDefault(
      identity.tenantContext,
      projectId,
      project.name
    );

    if (existing === null) {
      throw projectNotFoundError();
    }

    const payload = await parseSiteSettingsPayload({
      body,
      context: identity.tenantContext,
      projectId,
      client: this.client
    });
    const updated = await this.client.$transaction(async (transaction) => {
      const transactionRepository = new ProjectSiteSettingsRepository(transaction);
      const auditLogRepository = new AuditLogRepository(transaction);
      const saved = await transactionRepository.updateDraft({
        tenantContext: identity.tenantContext,
        projectId,
        headerEnabled: payload.headerEnabled,
        footerEnabled: payload.footerEnabled,
        headerDraft: payload.header,
        footerDraft: payload.footer
      });

      if (saved === null) {
        throw projectNotFoundError();
      }

      await auditLogRepository.create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: headerAction(existing.headerEnabled, payload.headerEnabled),
        entityType: "ProjectSiteSettings",
        entityId: saved.id,
        metadata: {
          projectId,
          revision: saved.revision
        }
      });
      await auditLogRepository.create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: footerAction(existing.footerEnabled, payload.footerEnabled),
        entityType: "ProjectSiteSettings",
        entityId: saved.id,
        metadata: {
          projectId,
          revision: saved.revision
        }
      });

      return saved;
    });

    return toProjectSiteSettingsResponse(updated);
  }

  private async getProjectOrThrow(
    context: TenantContext,
    projectId: string
  ) {
    const project = await new ProjectRepository(this.client).findByTenantContextAndId({
      tenantContext: context,
      projectId
    });

    if (project === null) {
      throw projectNotFoundError();
    }

    return project;
  }
}

async function parseSiteSettingsPayload(input: {
  readonly body: unknown;
  readonly context: TenantContext;
  readonly projectId: string;
  readonly client: DatabasePrismaClient;
}): Promise<{
  readonly headerEnabled: boolean;
  readonly footerEnabled: boolean;
  readonly header: SiteHeaderDraftJson;
  readonly footer: SiteFooterDraftJson;
}> {
  if (!isRecord(input.body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  const issues: ApiValidationIssue[] = [];
  const header = parseHeader(input.body.header, issues);
  const footer = parseFooter(input.body.footer, issues);
  const headerEnabled = parseBoolean(input.body.headerEnabled, "headerEnabled", issues);
  const footerEnabled = parseBoolean(input.body.footerEnabled, "footerEnabled", issues);

  if (header !== null) {
    await validateNavigationPages({
      context: input.context,
      projectId: input.projectId,
      client: input.client,
      header,
      issues
    });
  }

  if (
    header === null ||
    footer === null ||
    headerEnabled === null ||
    footerEnabled === null ||
    issues.length > 0
  ) {
    throw badRequest(
      API_ERROR_CODES.pageGlobalRegionInvalid,
      "Site settings payload is invalid.",
      issues
    );
  }

  return {
    headerEnabled,
    footerEnabled,
    header,
    footer
  };
}

function parseHeader(
  value: unknown,
  issues: ApiValidationIssue[]
): SiteHeaderDraftJson | null {
  if (!isRecord(value)) {
    issues.push(fieldIssue("header", "Header settings are required."));
    return null;
  }

  const brandText = parseText(value.brandText, "header.brandText", 80, issues);
  const logoUrl = parseOptionalUrl(value.logoUrl, "header.logoUrl", issues);
  const cartLinkEnabled = parseBoolean(
    value.cartLinkEnabled,
    "header.cartLinkEnabled",
    issues
  );
  const ctaLabel = parseText(value.ctaLabel ?? "", "header.ctaLabel", 40, issues);
  const ctaUrl = parseOptionalUrl(value.ctaUrl ?? "", "header.ctaUrl", issues);
  const navigation = parseNavigation(value.navigation, issues);

  if (
    brandText === null ||
    logoUrl === null ||
    cartLinkEnabled === null ||
    ctaLabel === null ||
    ctaUrl === null ||
    navigation === null
  ) {
    return null;
  }

  return {
    brandText,
    logoUrl,
    navigation,
    cartLinkEnabled,
    ctaLabel,
    ctaUrl
  };
}

function parseFooter(
  value: unknown,
  issues: ApiValidationIssue[]
): SiteFooterDraftJson | null {
  if (!isRecord(value)) {
    issues.push(fieldIssue("footer", "Footer settings are required."));
    return null;
  }

  const brandText = parseText(value.brandText, "footer.brandText", 80, issues);
  const description = parseText(value.description ?? "", "footer.description", 280, issues);
  const email = parseOptionalEmail(value.email ?? "", "footer.email", issues);
  const phone = parseText(value.phone ?? "", "footer.phone", 40, issues);
  const legalText = parseText(value.legalText ?? "", "footer.legalText", 600, issues);
  const copyrightText = parseText(
    value.copyrightText ?? "",
    "footer.copyrightText",
    160,
    issues
  );

  if (
    brandText === null ||
    description === null ||
    email === null ||
    phone === null ||
    legalText === null ||
    copyrightText === null
  ) {
    return null;
  }

  return {
    brandText,
    description,
    email,
    phone,
    legalText,
    copyrightText
  };
}

function parseNavigation(
  value: unknown,
  issues: ApiValidationIssue[]
): SiteHeaderDraftJson["navigation"] | null {
  if (!Array.isArray(value)) {
    issues.push(fieldIssue("header.navigation", "Navigation must be an array."));
    return null;
  }

  if (value.length > 8) {
    issues.push(fieldIssue("header.navigation", "Navigation has too many items."));
    return null;
  }

  const items: {
    label: string;
    type: "page" | "external";
    pageId?: string | undefined;
    url?: string | undefined;
  }[] = [];

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      issues.push(fieldIssue(`header.navigation.${index}`, "Navigation item is invalid."));
      continue;
    }

    const label = parseText(item.label, `header.navigation.${index}.label`, 40, issues);

    if (item.type === "page") {
      const pageId = parseText(item.pageId, `header.navigation.${index}.pageId`, 120, issues);

      if (label !== null && pageId !== null) {
        items.push({
          label,
          type: "page",
          pageId
        });
      }
      continue;
    }

    if (item.type === "external") {
      const url = parseOptionalUrl(item.url, `header.navigation.${index}.url`, issues);

      if (label !== null && url !== null && url !== "") {
        items.push({
          label,
          type: "external",
          url
        });
      }
      continue;
    }

    issues.push(fieldIssue(`header.navigation.${index}.type`, "Navigation item type is invalid."));
  }

  return items;
}

async function validateNavigationPages(input: {
  readonly context: TenantContext;
  readonly projectId: string;
  readonly client: DatabasePrismaClient;
  readonly header: SiteHeaderDraftJson;
  readonly issues: ApiValidationIssue[];
}): Promise<void> {
  const pageIds = input.header.navigation.flatMap((item) =>
    item.type === "page" && item.pageId !== undefined ? [item.pageId] : []
  );

  if (pageIds.length === 0) {
    return;
  }

  const pages = await input.client.sitePage.findMany({
    where: {
      organizationId: input.context.organizationId,
      projectId: input.projectId,
      id: {
        in: pageIds
      },
      deletedAt: null
    },
    select: {
      id: true
    }
  });
  const validPageIds = new Set(pages.map((page) => page.id));

  for (const pageId of pageIds) {
    if (!validPageIds.has(pageId)) {
      input.issues.push(fieldIssue("header.navigation", "Navigation page is not in this project."));
    }
  }
}

function parseBoolean(
  value: unknown,
  field: string,
  issues: ApiValidationIssue[]
): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  issues.push({
    field,
    code: "FIELD_INVALID_TYPE",
    message: `${field} must be a boolean.`
  });
  return null;
}

function parseText(
  value: unknown,
  field: string,
  maxLength: number,
  issues: ApiValidationIssue[]
): string | null {
  if (typeof value !== "string") {
    issues.push({
      field,
      code: "FIELD_INVALID_TYPE",
      message: `${field} must be a string.`
    });
    return null;
  }

  const text = value.trim();

  if (text.includes("<") || text.includes(">") || /script/i.test(text)) {
    issues.push(fieldIssue(field, `${field} must not contain HTML or scripts.`));
    return null;
  }

  if (text.length > maxLength) {
    issues.push(fieldIssue(field, `${field} is too long.`));
    return null;
  }

  return text;
}

function parseOptionalEmail(
  value: unknown,
  field: string,
  issues: ApiValidationIssue[]
): string | null {
  const text = parseText(value, field, 120, issues);

  if (text === null || text === "") {
    return text;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    issues.push(fieldIssue(field, `${field} must be a valid email.`));
    return null;
  }

  return text;
}

function parseOptionalUrl(
  value: unknown,
  field: string,
  issues: ApiValidationIssue[]
): string | null {
  const text = parseText(value, field, 500, issues);

  if (text === null || text === "") {
    return text;
  }

  try {
    const url = new URL(text);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return text;
    }
  } catch {
    // handled below
  }

  issues.push(fieldIssue(field, `${field} must be an http or https URL.`));
  return null;
}

function headerAction(wasEnabled: boolean, isEnabled: boolean): string {
  return wasEnabled === isEnabled ? "SITE_HEADER_UPDATED" : "SITE_HEADER_TOGGLED";
}

function footerAction(wasEnabled: boolean, isEnabled: boolean): string {
  return wasEnabled === isEnabled ? "SITE_FOOTER_UPDATED" : "SITE_FOOTER_TOGGLED";
}

function toProjectSiteSettingsResponse(settings: {
  readonly projectId: string;
  readonly revision: number;
  readonly headerEnabled: boolean;
  readonly footerEnabled: boolean;
  readonly headerDraft: unknown;
  readonly footerDraft: unknown;
}): ProjectSiteSettingsResponse {
  return {
    projectId: settings.projectId,
    revision: settings.revision,
    headerEnabled: settings.headerEnabled,
    footerEnabled: settings.footerEnabled,
    header: settings.headerDraft as SiteHeaderDraftJson,
    footer: settings.footerDraft as SiteFooterDraftJson
  };
}

function projectNotFoundError() {
  return notFound(API_ERROR_CODES.projectNotFound, "Project was not found.");
}

function fieldIssue(field: string, message: string): ApiValidationIssue {
  return {
    field,
    code: "FIELD_INVALID_VALUE",
    message
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
