import { Inject, Injectable } from "@nestjs/common";
import type { Project, SitePage } from "@site-platform/database";
import {
  DOMAIN_ERROR_CODES,
  PERMISSIONS,
  hasPermission,
  type TenantContext,
  validatePageSlug,
  validatePageTitle,
  validateProjectName,
  validateProjectSlug
} from "@site-platform/domain";
import {
  API_ERROR_CODES,
  badRequest,
  conflict,
  forbidden,
  notFound,
  type ApiValidationIssue
} from "./api-errors";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import {
  PROJECT_STORE,
  isPageSlugUniqueError,
  isProjectSlugUniqueError,
  type ProjectStore
} from "./project-store";

export type ProjectResponse = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  readonly createdAt: string;
};

export type ProjectsListResponse = {
  readonly projects: readonly ProjectResponse[];
};

export type CreateProjectResponse = {
  readonly project: ProjectResponse;
};

export type SitePageResponse = {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly slug: string;
  readonly status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  readonly isHome: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProjectPagesListResponse = {
  readonly pages: readonly SitePageResponse[];
};

export type CreateProjectPageResponse = {
  readonly page: SitePageResponse;
};

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver,
    @Inject(PROJECT_STORE) private readonly projectStore: ProjectStore
  ) {}

  async listProjects(): Promise<ProjectsListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    const projects = await this.projectStore.listByTenant(identity.tenantContext);

    return {
      projects: projects.map(toProjectResponse)
    };
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    const project = await this.getProjectOrThrow(identity.tenantContext, projectId);

    return toProjectResponse(project);
  }

  async createProject(body: unknown): Promise<CreateProjectResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, PERMISSIONS.projectCreate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to create projects."
      );
    }

    const payload = parseCreateProjectPayload(body);
    const existingProject = await this.projectStore.findByTenantAndSlug(
      identity.tenantContext,
      payload.slug
    );

    if (existingProject !== null) {
      throw duplicateSlugError();
    }

    try {
      const project = await this.projectStore.createDraftWithAudit({
        tenantContext: identity.tenantContext,
        name: payload.name,
        slug: payload.slug
      });

      return {
        project: toProjectResponse(project)
      };
    } catch (error) {
      if (isProjectSlugUniqueError(error)) {
        throw duplicateSlugError();
      }

      throw error;
    }
  }

  async listProjectPages(projectId: string): Promise<ProjectPagesListResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    const pages = await this.projectStore.listPagesByProject(
      identity.tenantContext,
      projectId
    );

    return {
      pages: pages.map(toSitePageResponse)
    };
  }

  async createProjectPage(
    projectId: string,
    body: unknown
  ): Promise<CreateProjectPageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageCreate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to create pages."
      );
    }

    const payload = parseCreatePagePayload(body);

    try {
      const page = await this.projectStore.createPageWithAudit({
        tenantContext: identity.tenantContext,
        projectId,
        title: payload.title,
        slug: payload.slug,
        isHome: payload.isHome
      });

      if (page === null) {
        throw projectNotFoundError();
      }

      return {
        page: toSitePageResponse(page)
      };
    } catch (error) {
      if (isPageSlugUniqueError(error)) {
        throw duplicatePageSlugError();
      }

      throw error;
    }
  }

  async getProjectPage(
    projectId: string,
    pageId: string
  ): Promise<SitePageResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    await this.getProjectOrThrow(identity.tenantContext, projectId);

    if (!hasPermission(identity.role, PERMISSIONS.pageRead)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to read pages."
      );
    }

    const page = await this.projectStore.findPageById(
      identity.tenantContext,
      projectId,
      pageId
    );

    if (page === null) {
      throw notFound(
        API_ERROR_CODES.pageNotFound,
        "Project page was not found."
      );
    }

    return toSitePageResponse(page);
  }

  private async getProjectOrThrow(
    tenantContext: TenantContext,
    projectId: string
  ): Promise<Project> {
    const project = await this.projectStore.findByTenantAndId(
      tenantContext,
      projectId
    );

    if (project === null) {
      throw projectNotFoundError();
    }

    return project;
  }
}

export function toProjectResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    status: project.status,
    createdAt: project.createdAt.toISOString()
  };
}

export function toSitePageResponse(page: SitePage): SitePageResponse {
  return {
    id: page.id,
    projectId: page.projectId,
    title: page.title,
    slug: page.slug,
    status: page.status,
    isHome: page.isHome,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString()
  };
}

function parseCreateProjectPayload(body: unknown): {
  readonly name: string;
  readonly slug: string;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawName = body.name;
  const rawSlug = body.slug;

  if (typeof rawName !== "string") {
    issues.push({
      field: "name",
      code: rawName === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Project name is required."
    });
  }

  if (typeof rawSlug !== "string") {
    issues.push({
      field: "slug",
      code: rawSlug === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Project slug is required."
    });
  }

  if (typeof rawName !== "string" || typeof rawSlug !== "string") {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Project payload is invalid.",
      issues
    );
  }

  const nameResult = validateProjectName(rawName);
  const slugResult = validateProjectSlug(rawSlug);

  if (!nameResult.ok) {
    issues.push({
      field: "name",
      code: nameResult.code,
      message: toValidationMessage(nameResult.code)
    });
  }

  if (!slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (!nameResult.ok || !slugResult.ok) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Project payload is invalid.",
      issues
    );
  }

  return {
    name: nameResult.value,
    slug: slugResult.value
  };
}

function parseCreatePagePayload(body: unknown): {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
} {
  if (!isRecord(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.", [
      {
        field: "body",
        code: "FIELD_INVALID_TYPE",
        message: "Request body must be an object."
      }
    ]);
  }

  if ("organizationId" in body) {
    throw badRequest(
      API_ERROR_CODES.organizationIdNotAllowed,
      "organizationId must not be provided in the request body."
    );
  }

  const issues: ApiValidationIssue[] = [];
  const rawTitle = body.title;
  const rawSlug = body.slug;
  const rawIsHome = body.isHome;

  if (typeof rawTitle !== "string") {
    issues.push({
      field: "title",
      code: rawTitle === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Page title is required."
    });
  }

  if (typeof rawSlug !== "string") {
    issues.push({
      field: "slug",
      code: rawSlug === undefined ? "FIELD_REQUIRED" : "FIELD_INVALID_TYPE",
      message: "Page slug is required."
    });
  }

  if (rawIsHome !== undefined && typeof rawIsHome !== "boolean") {
    issues.push({
      field: "isHome",
      code: "FIELD_INVALID_TYPE",
      message: "isHome must be a boolean."
    });
  }

  if (typeof rawTitle !== "string" || typeof rawSlug !== "string") {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Page payload is invalid.",
      issues
    );
  }

  const titleResult = validatePageTitle(rawTitle);
  const slugResult = validatePageSlug(rawSlug);

  if (!titleResult.ok) {
    issues.push({
      field: "title",
      code: titleResult.code,
      message: toValidationMessage(titleResult.code)
    });
  }

  if (!slugResult.ok) {
    issues.push({
      field: "slug",
      code: slugResult.code,
      message: toValidationMessage(slugResult.code)
    });
  }

  if (!titleResult.ok || !slugResult.ok || issues.length > 0) {
    throw badRequest(
      API_ERROR_CODES.validationFailed,
      "Page payload is invalid.",
      issues
    );
  }

  return {
    title: titleResult.value,
    slug: slugResult.value,
    isHome: rawIsHome === true
  };
}

function duplicateSlugError() {
  return conflict(
    API_ERROR_CODES.projectSlugAlreadyExists,
    "Project slug already exists inside the active organization."
  );
}

function duplicatePageSlugError() {
  return conflict(
    API_ERROR_CODES.pageSlugAlreadyExists,
    "Page slug already exists inside this project."
  );
}

function projectNotFoundError() {
  return notFound(API_ERROR_CODES.projectNotFound, "Project was not found.");
}

function toValidationMessage(code: string): string {
  switch (code) {
    case DOMAIN_ERROR_CODES.projectNameRequired:
      return "Project name is required.";
    case DOMAIN_ERROR_CODES.projectNameTooShort:
      return "Project name is too short.";
    case DOMAIN_ERROR_CODES.projectNameTooLong:
      return "Project name is too long.";
    case DOMAIN_ERROR_CODES.projectSlugRequired:
      return "Project slug is required.";
    case DOMAIN_ERROR_CODES.projectSlugTooShort:
      return "Project slug is too short.";
    case DOMAIN_ERROR_CODES.projectSlugTooLong:
      return "Project slug is too long.";
    case DOMAIN_ERROR_CODES.projectSlugInvalidFormat:
      return "Project slug may contain lowercase letters, numbers and hyphens.";
    case DOMAIN_ERROR_CODES.pageTitleRequired:
      return "Page title is required.";
    case DOMAIN_ERROR_CODES.pageTitleTooShort:
      return "Page title is too short.";
    case DOMAIN_ERROR_CODES.pageTitleTooLong:
      return "Page title is too long.";
    case DOMAIN_ERROR_CODES.pageSlugRequired:
      return "Page slug is required.";
    case DOMAIN_ERROR_CODES.pageSlugTooShort:
      return "Page slug is too short.";
    case DOMAIN_ERROR_CODES.pageSlugTooLong:
      return "Page slug is too long.";
    case DOMAIN_ERROR_CODES.pageSlugInvalidFormat:
      return "Page slug may contain lowercase letters, numbers and hyphens.";
    default:
      return "Value is invalid.";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
