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

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CURRENCY = "RUB" as const;

export type ProductCurrency = typeof PRODUCT_CURRENCY;

export const PRODUCT_AVAILABILITIES = [
  "in-stock",
  "out-of-stock",
  "preorder"
] as const;

export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];

export type Money = {
  readonly amountMinor: number;
  readonly currency: ProductCurrency;
};

export type Product = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly status: ProductStatus;
  readonly primaryMediaAssetId: string | null;
};

export type ProductVariant = {
  readonly id: string;
  readonly organizationId: string;
  readonly projectId: string;
  readonly productId: string;
  readonly title: string;
  readonly sku: string;
  readonly price: Money;
  readonly compareAtPrice: Money | null;
  readonly stockQuantity: number;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
  readonly isDefault: boolean;
  readonly position: number;
};

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
  pageSlugReserved: "PAGE_SLUG_RESERVED",
  publicHandleRequired: "PUBLIC_HANDLE_REQUIRED",
  publicHandleTooShort: "PUBLIC_HANDLE_TOO_SHORT",
  publicHandleTooLong: "PUBLIC_HANDLE_TOO_LONG",
  publicHandleInvalidFormat: "PUBLIC_HANDLE_INVALID_FORMAT",
  publicHandleReserved: "PUBLIC_HANDLE_RESERVED",
  productTitleRequired: "PRODUCT_TITLE_REQUIRED",
  productTitleTooShort: "PRODUCT_TITLE_TOO_SHORT",
  productTitleTooLong: "PRODUCT_TITLE_TOO_LONG",
  productSlugRequired: "PRODUCT_SLUG_REQUIRED",
  productSlugTooLong: "PRODUCT_SLUG_TOO_LONG",
  productSlugInvalidFormat: "PRODUCT_SLUG_INVALID_FORMAT",
  productSlugReserved: "PRODUCT_SLUG_RESERVED",
  variantTitleRequired: "VARIANT_TITLE_REQUIRED",
  variantTitleTooLong: "VARIANT_TITLE_TOO_LONG",
  variantSkuRequired: "VARIANT_SKU_REQUIRED",
  variantSkuTooLong: "VARIANT_SKU_TOO_LONG",
  variantSkuInvalidFormat: "VARIANT_SKU_INVALID_FORMAT",
  moneyMinorInvalid: "MONEY_MINOR_INVALID",
  compareAtPriceInvalid: "COMPARE_AT_PRICE_INVALID",
  stockQuantityInvalid: "STOCK_QUANTITY_INVALID",
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
const PUBLIC_HANDLE_MIN_LENGTH = 3;
const PUBLIC_HANDLE_MAX_LENGTH = 48;
const PUBLIC_HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCT_TITLE_MIN_LENGTH = 2;
const PRODUCT_TITLE_MAX_LENGTH = 160;
const PRODUCT_SLUG_MAX_LENGTH = 80;
const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VARIANT_TITLE_MAX_LENGTH = 120;
const VARIANT_SKU_MAX_LENGTH = 64;
const VARIANT_SKU_PATTERN = /^[A-Za-z0-9_-]+$/;
export const RESERVED_PUBLIC_HANDLES = [
  "api",
  "admin",
  "dashboard",
  "login",
  "signup",
  "media",
  "assets",
  "preview",
  "projects",
  "static",
  "health",
  "www"
] as const;
export const RESERVED_PAGE_SLUGS = [
  "api",
  "admin",
  "media",
  "assets",
  "preview",
  "editor",
  "_next",
  "favicon.ico"
] as const;
export const RESERVED_PRODUCT_SLUGS = [
  "new",
  "edit",
  "api",
  "admin",
  "cart",
  "checkout",
  "media",
  "products",
  "catalog"
] as const;

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

  if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(normalizedSlug)) {
    return invalid(DOMAIN_ERROR_CODES.pageSlugReserved);
  }

  return valid(normalizedSlug);
}

export function validatePublicHandle(handle: string): ValidationResult<string> {
  const normalizedHandle = handle.trim().toLowerCase();

  if (normalizedHandle.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.publicHandleRequired);
  }

  if (normalizedHandle.length < PUBLIC_HANDLE_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.publicHandleTooShort);
  }

  if (normalizedHandle.length > PUBLIC_HANDLE_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.publicHandleTooLong);
  }

  if (!PUBLIC_HANDLE_PATTERN.test(normalizedHandle)) {
    return invalid(DOMAIN_ERROR_CODES.publicHandleInvalidFormat);
  }

  if ((RESERVED_PUBLIC_HANDLES as readonly string[]).includes(normalizedHandle)) {
    return invalid(DOMAIN_ERROR_CODES.publicHandleReserved);
  }

  return valid(normalizedHandle);
}

export function validateProductTitle(title: string): ValidationResult<string> {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (normalizedTitle.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.productTitleRequired);
  }

  if (normalizedTitle.length < PRODUCT_TITLE_MIN_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.productTitleTooShort);
  }

  if (normalizedTitle.length > PRODUCT_TITLE_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.productTitleTooLong);
  }

  return valid(normalizedTitle);
}

export function validateProductSlug(slug: string): ValidationResult<string> {
  const normalizedSlug = slug.trim().toLowerCase();

  if (normalizedSlug.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.productSlugRequired);
  }

  if (normalizedSlug.length > PRODUCT_SLUG_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.productSlugTooLong);
  }

  if (!PRODUCT_SLUG_PATTERN.test(normalizedSlug)) {
    return invalid(DOMAIN_ERROR_CODES.productSlugInvalidFormat);
  }

  if ((RESERVED_PRODUCT_SLUGS as readonly string[]).includes(normalizedSlug)) {
    return invalid(DOMAIN_ERROR_CODES.productSlugReserved);
  }

  return valid(normalizedSlug);
}

export function validateVariantTitle(title: string): ValidationResult<string> {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  if (normalizedTitle.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.variantTitleRequired);
  }

  if (normalizedTitle.length > VARIANT_TITLE_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.variantTitleTooLong);
  }

  return valid(normalizedTitle);
}

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

export function validateVariantSku(sku: string): ValidationResult<string> {
  const normalizedSku = normalizeSku(sku);

  if (normalizedSku.length === 0) {
    return invalid(DOMAIN_ERROR_CODES.variantSkuRequired);
  }

  if (normalizedSku.length > VARIANT_SKU_MAX_LENGTH) {
    return invalid(DOMAIN_ERROR_CODES.variantSkuTooLong);
  }

  if (!VARIANT_SKU_PATTERN.test(normalizedSku)) {
    return invalid(DOMAIN_ERROR_CODES.variantSkuInvalidFormat);
  }

  return valid(normalizedSku);
}

export function validateMoneyMinor(amountMinor: number): ValidationResult<Money> {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    return invalid(DOMAIN_ERROR_CODES.moneyMinorInvalid);
  }

  return valid({
    amountMinor,
    currency: PRODUCT_CURRENCY
  });
}

export function validateCompareAtPriceMinor(
  priceMinor: number,
  compareAtPriceMinor: number | null
): ValidationResult<Money | null> {
  if (compareAtPriceMinor === null) {
    return valid(null);
  }

  if (
    !Number.isInteger(compareAtPriceMinor) ||
    compareAtPriceMinor < 0 ||
    compareAtPriceMinor <= priceMinor
  ) {
    return invalid(DOMAIN_ERROR_CODES.compareAtPriceInvalid);
  }

  return valid({
    amountMinor: compareAtPriceMinor,
    currency: PRODUCT_CURRENCY
  });
}

export function validateStockQuantity(quantity: number): ValidationResult<number> {
  if (!Number.isInteger(quantity) || quantity < 0) {
    return invalid(DOMAIN_ERROR_CODES.stockQuantityInvalid);
  }

  return valid(quantity);
}

export function getProductAvailability(input: {
  readonly trackInventory: boolean;
  readonly stockQuantity: number;
  readonly allowBackorder: boolean;
}): ProductAvailability {
  if (!input.trackInventory || input.stockQuantity > 0) {
    return "in-stock";
  }

  return input.allowBackorder ? "preorder" : "out-of-stock";
}

export function formatRubMoney(money: Money): string {
  const rubles = Math.floor(money.amountMinor / 100);
  const kopecks = money.amountMinor % 100;

  return `${rubles.toLocaleString("ru-RU")},${kopecks
    .toString()
    .padStart(2, "0")} ₽`;
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
