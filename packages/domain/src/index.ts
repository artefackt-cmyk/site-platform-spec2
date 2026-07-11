export const packageName = "@site-platform/domain" as const;

export const ORGANIZATION_ROLES = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "STORE_MANAGER",
  "VIEWER"
] as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const PAGE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type PageStatus = (typeof PAGE_STATUSES)[number];

export type TenantContext = {
  readonly organizationId: string;
  readonly userId: string;
  readonly membershipId: string;
  readonly role: OrganizationRole;
};

export const PERMISSIONS = {
  organizationRead: "organization.read",
  organizationUpdate: "organization.update",
  membershipRead: "membership.read",
  membershipManage: "membership.manage",
  projectRead: "project.read",
  projectCreate: "project.create",
  projectUpdate: "project.update",
  projectDelete: "project.delete",
  pageRead: "page.read",
  pageCreate: "page.create",
  pageUpdate: "page.update",
  pageDelete: "page.delete",
  contentRead: "content.read",
  contentUpdate: "content.update",
  designUpdate: "design.update",
  auditRead: "audit.read",
  integrationManage: "integration.manage"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = [
  PERMISSIONS.organizationRead,
  PERMISSIONS.organizationUpdate,
  PERMISSIONS.membershipRead,
  PERMISSIONS.membershipManage,
  PERMISSIONS.projectRead,
  PERMISSIONS.projectCreate,
  PERMISSIONS.projectUpdate,
  PERMISSIONS.projectDelete,
  PERMISSIONS.pageRead,
  PERMISSIONS.pageCreate,
  PERMISSIONS.pageUpdate,
  PERMISSIONS.pageDelete,
  PERMISSIONS.contentRead,
  PERMISSIONS.contentUpdate,
  PERMISSIONS.designUpdate,
  PERMISSIONS.auditRead,
  PERMISSIONS.integrationManage
] as const satisfies readonly Permission[];

export const MUTATION_PERMISSIONS = [
  PERMISSIONS.organizationUpdate,
  PERMISSIONS.membershipManage,
  PERMISSIONS.projectCreate,
  PERMISSIONS.projectUpdate,
  PERMISSIONS.projectDelete,
  PERMISSIONS.pageCreate,
  PERMISSIONS.pageUpdate,
  PERMISSIONS.pageDelete,
  PERMISSIONS.contentUpdate,
  PERMISSIONS.designUpdate,
  PERMISSIONS.integrationManage
] as const satisfies readonly Permission[];

export const ROLE_PERMISSIONS = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  EDITOR: [
    PERMISSIONS.organizationRead,
    PERMISSIONS.projectRead,
    PERMISSIONS.pageRead,
    PERMISSIONS.pageCreate,
    PERMISSIONS.pageUpdate,
    PERMISSIONS.contentRead,
    PERMISSIONS.contentUpdate,
    PERMISSIONS.designUpdate
  ],
  STORE_MANAGER: [
    PERMISSIONS.organizationRead,
    PERMISSIONS.projectRead,
    PERMISSIONS.pageRead,
    PERMISSIONS.contentRead
  ],
  VIEWER: [
    PERMISSIONS.organizationRead,
    PERMISSIONS.projectRead,
    PERMISSIONS.pageRead,
    PERMISSIONS.contentRead
  ]
} as const satisfies Record<OrganizationRole, readonly Permission[]>;

export const DOMAIN_ERROR_CODES = {
  organizationNameRequired: "ORGANIZATION_NAME_REQUIRED",
  organizationNameTooShort: "ORGANIZATION_NAME_TOO_SHORT",
  organizationNameTooLong: "ORGANIZATION_NAME_TOO_LONG",
  projectNameRequired: "PROJECT_NAME_REQUIRED",
  projectNameTooShort: "PROJECT_NAME_TOO_SHORT",
  projectNameTooLong: "PROJECT_NAME_TOO_LONG",
  projectSlugRequired: "PROJECT_SLUG_REQUIRED",
  projectSlugTooShort: "PROJECT_SLUG_TOO_SHORT",
  projectSlugTooLong: "PROJECT_SLUG_TOO_LONG",
  projectSlugInvalidFormat: "PROJECT_SLUG_INVALID_FORMAT",
  pageTitleRequired: "PAGE_TITLE_REQUIRED",
  pageTitleTooShort: "PAGE_TITLE_TOO_SHORT",
  pageTitleTooLong: "PAGE_TITLE_TOO_LONG",
  pageSlugRequired: "PAGE_SLUG_REQUIRED",
  pageSlugTooShort: "PAGE_SLUG_TOO_SHORT",
  pageSlugTooLong: "PAGE_SLUG_TOO_LONG",
  pageSlugInvalidFormat: "PAGE_SLUG_INVALID_FORMAT",
  tenantContextRequired: "TENANT_CONTEXT_REQUIRED",
  tenantScopedEntityNotFound: "TENANT_SCOPED_ENTITY_NOT_FOUND"
} as const;

export type DomainErrorCode =
  (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES];

export type ValidationResult<TValue> =
  | {
      readonly ok: true;
      readonly value: TValue;
    }
  | {
      readonly ok: false;
      readonly code: DomainErrorCode;
    };

const ORGANIZATION_NAME_MIN_LENGTH = 2;
const ORGANIZATION_NAME_MAX_LENGTH = 120;
const PROJECT_NAME_MIN_LENGTH = 2;
const PROJECT_NAME_MAX_LENGTH = 120;
const PROJECT_SLUG_MIN_LENGTH = 2;
const PROJECT_SLUG_MAX_LENGTH = 80;
const PROJECT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PAGE_TITLE_MIN_LENGTH = 2;
const PAGE_TITLE_MAX_LENGTH = 120;
const PAGE_SLUG_MIN_LENGTH = 1;
const PAGE_SLUG_MAX_LENGTH = 80;
const PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function hasPermission(
  role: OrganizationRole,
  permission: Permission
): boolean {
  const permissions: readonly Permission[] = ROLE_PERMISSIONS[role];

  return permissions.includes(permission);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateOrganizationName(
  name: string
): ValidationResult<string> {
  const normalizedName = name.trim().replace(/\s+/g, " ");

  if (normalizedName.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.organizationNameRequired);
  }

  if (normalizedName.length < ORGANIZATION_NAME_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.organizationNameTooShort);
  }

  if (normalizedName.length > ORGANIZATION_NAME_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.organizationNameTooLong);
  }

  return valid(normalizedName);
}

export function validateProjectName(name: string): ValidationResult<string> {
  const normalizedName = name.trim().replace(/\s+/g, " ");

  if (normalizedName.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.projectNameRequired);
  }

  if (normalizedName.length < PROJECT_NAME_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.projectNameTooShort);
  }

  if (normalizedName.length > PROJECT_NAME_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.projectNameTooLong);
  }

  return valid(normalizedName);
}

export function validateProjectSlug(slug: string): ValidationResult<string> {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.projectSlugRequired);
  }

  if (normalizedSlug.length < PROJECT_SLUG_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.projectSlugTooShort);
  }

  if (normalizedSlug.length > PROJECT_SLUG_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.projectSlugTooLong);
  }

  if (!PROJECT_SLUG_PATTERN.test(normalizedSlug)) {
    return invalid(DOMAIN_ERROR_CODES.projectSlugInvalidFormat);
  }

  return valid(normalizedSlug);
}

export function validatePageTitle(title: string): ValidationResult<string> {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (normalizedTitle.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.pageTitleRequired);
  }

  if (normalizedTitle.length < PAGE_TITLE_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.pageTitleTooShort);
  }

  if (normalizedTitle.length > PAGE_TITLE_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.pageTitleTooLong);
  }

  return valid(normalizedTitle);
}

export function validatePageSlug(slug: string): ValidationResult<string> {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.pageSlugRequired);
  }

  if (normalizedSlug.length < PAGE_SLUG_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.pageSlugTooShort);
  }

  if (normalizedSlug.length > PAGE_SLUG_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.pageSlugTooLong);
  }

  if (!PAGE_SLUG_PATTERN.test(normalizedSlug)) {
    return invalid(DOMAIN_ERROR_CODES.pageSlugInvalidFormat);
  }

  return valid(normalizedSlug);
}

function valid<TValue>(value: TValue): ValidationResult<TValue> {
  return {
    ok: true,
    value
  };
}

function invalid(code: DomainErrorCode): ValidationResult<never> {
  return {
    ok: false,
    code
  };
}
