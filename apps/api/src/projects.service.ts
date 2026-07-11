import { Inject, Injectable } from "@nestjs/common";
import type { Project } from "@site-platform/database";
import {
  DOMAIN_ERROR_CODES,
  PERMISSIONS,
  hasPermission,
  validateProjectName,
  validateProjectSlug
} from "@site-platform/domain";
import {
  API_ERROR_CODES,
  badRequest,
  conflict,
  forbidden,
  type ApiValidationIssue
} from "./api-errors";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import {
  PROJECT_STORE,
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

function duplicateSlugError() {
  return conflict(
    API_ERROR_CODES.projectSlugAlreadyExists,
    "Project slug already exists inside the active organization."
  );
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
    default:
      return "Value is invalid.";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
