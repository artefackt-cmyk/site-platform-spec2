import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import type { DomainErrorCode } from "@site-platform/domain";

export const API_ERROR_CODES = {
  developmentIdentityDisabled: "DEVELOPMENT_IDENTITY_DISABLED",
  devUserEmailRequired: "DEV_USER_EMAIL_REQUIRED",
  devUserNotFound: "DEV_USER_NOT_FOUND",
  devMembershipNotFound: "DEV_MEMBERSHIP_NOT_FOUND",
  permissionDenied: "PERMISSION_DENIED",
  validationFailed: "VALIDATION_FAILED",
  organizationIdNotAllowed: "ORGANIZATION_ID_NOT_ALLOWED",
  projectNotFound: "PROJECT_NOT_FOUND",
  siteNotFound: "SITE_NOT_FOUND",
  siteSlugAlreadyExists: "SITE_SLUG_ALREADY_EXISTS",
  siteSlugInvalid: "SITE_SLUG_INVALID",
  siteCannotArchiveOnlyActive: "SITE_CANNOT_ARCHIVE_ONLY_ACTIVE",
  siteCannotArchiveDefault: "SITE_CANNOT_ARCHIVE_DEFAULT",
  pageNotFound: "PAGE_NOT_FOUND",
  projectSlugAlreadyExists: "PROJECT_SLUG_ALREADY_EXISTS",
  pageSlugAlreadyExists: "PAGE_SLUG_ALREADY_EXISTS",
  pageDocumentInvalid: "PAGE_DOCUMENT_INVALID",
  pageDocumentRevisionConflict: "PAGE_DOCUMENT_REVISION_CONFLICT",
  pageSectionNotFound: "PAGE_SECTION_NOT_FOUND",
  pageSectionLimitReached: "PAGE_SECTION_LIMIT_REACHED",
  pageSectionNameInvalid: "PAGE_SECTION_NAME_INVALID",
  pageSectionOrderInvalid: "PAGE_SECTION_ORDER_INVALID",
  pageSectionDuplicationFailed: "PAGE_SECTION_DUPLICATION_FAILED",
  pageGlobalRegionInvalid: "PAGE_GLOBAL_REGION_INVALID",
  mediaAssetNotFound: "MEDIA_ASSET_NOT_FOUND",
  mediaAssetInvalid: "MEDIA_ASSET_INVALID",
  mediaAssetInUse: "MEDIA_ASSET_IN_USE",
  mediaUploadFailed: "MEDIA_UPLOAD_FAILED",
  pageDraftNotFound: "PAGE_DRAFT_NOT_FOUND",
  pageDraftInvalid: "PAGE_DRAFT_INVALID",
  pageDraftRevisionMismatch: "PAGE_DRAFT_REVISION_MISMATCH",
  pageSlugInvalid: "PAGE_SLUG_INVALID",
  pageSlugConflict: "PAGE_SLUG_CONFLICT",
  mediaAssetMissing: "MEDIA_ASSET_MISSING",
  mediaAssetFileMissing: "MEDIA_ASSET_FILE_MISSING",
  pageNotPublished: "PAGE_NOT_PUBLISHED",
  publicationSnapshotNotFound: "PUBLICATION_SNAPSHOT_NOT_FOUND",
  publicHandleInvalid: "PUBLIC_HANDLE_INVALID",
  publicHandleConflict: "PUBLIC_HANDLE_CONFLICT",
  publicHandleReserved: "PUBLIC_HANDLE_RESERVED",
  productNotFound: "PRODUCT_NOT_FOUND",
  productSlugInvalid: "PRODUCT_SLUG_INVALID",
  productSlugConflict: "PRODUCT_SLUG_CONFLICT",
  productCannotActivate: "PRODUCT_CANNOT_ACTIVATE",
  productHasNoVariants: "PRODUCT_HAS_NO_VARIANTS",
  productDefaultVariantRequired: "PRODUCT_DEFAULT_VARIANT_REQUIRED",
  productMediaAssetInvalid: "PRODUCT_MEDIA_ASSET_INVALID",
  productMediaNotFound: "PRODUCT_MEDIA_NOT_FOUND",
  productMediaDuplicate: "PRODUCT_MEDIA_DUPLICATE",
  productMediaLimitReached: "PRODUCT_MEDIA_LIMIT_REACHED",
  productMediaCrossProject: "PRODUCT_MEDIA_CROSS_PROJECT",
  productMediaPrimaryInvalid: "PRODUCT_MEDIA_PRIMARY_INVALID",
  variantNotFound: "VARIANT_NOT_FOUND",
  variantSkuInvalid: "VARIANT_SKU_INVALID",
  variantSkuConflict: "VARIANT_SKU_CONFLICT",
  variantPriceInvalid: "VARIANT_PRICE_INVALID",
  variantComparePriceInvalid: "VARIANT_COMPARE_PRICE_INVALID",
  variantStockInvalid: "VARIANT_STOCK_INVALID",
  cannotDeleteOnlyVariant: "CANNOT_DELETE_ONLY_VARIANT",
  cannotDeleteDefaultVariant: "CANNOT_DELETE_DEFAULT_VARIANT",
  authInvalidCredentials: "AUTH_INVALID_CREDENTIALS",
  authEmailAlreadyExists: "AUTH_EMAIL_ALREADY_EXISTS",
  authSessionRequired: "AUTH_SESSION_REQUIRED",
  authSessionExpired: "AUTH_SESSION_EXPIRED",
  authSessionRevoked: "AUTH_SESSION_REVOKED",
  authCsrfInvalid: "AUTH_CSRF_INVALID",
  authPasswordTooWeak: "AUTH_PASSWORD_TOO_WEAK",
  authResetTokenInvalid: "AUTH_RESET_TOKEN_INVALID",
  authResetTokenExpired: "AUTH_RESET_TOKEN_EXPIRED",
  authOnboardingRequired: "AUTH_ONBOARDING_REQUIRED",
  cartEmpty: "CART_EMPTY",
  cartItemInvalid: "CART_ITEM_INVALID",
  cartItemUnavailable: "CART_ITEM_UNAVAILABLE",
  cartQuantityInvalid: "CART_QUANTITY_INVALID",
  cartPriceChanged: "CART_PRICE_CHANGED",
  cartStockInsufficient: "CART_STOCK_INSUFFICIENT",
  orderNotFound: "ORDER_NOT_FOUND",
  orderIdempotencyConflict: "ORDER_IDEMPOTENCY_CONFLICT",
  orderStatusInvalid: "ORDER_STATUS_INVALID",
  orderStatusTransitionInvalid: "ORDER_STATUS_TRANSITION_INVALID",
  orderProjectUnavailable: "ORDER_PROJECT_UNAVAILABLE",
  orderCustomerInvalid: "ORDER_CUSTOMER_INVALID",
  rateLimitExceeded: "RATE_LIMIT_EXCEEDED"
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiValidationIssue = {
  readonly field: string;
  readonly code:
    | DomainErrorCode
    | "DOCUMENT_INVALID"
    | "MEDIA_INVALID"
    | "FIELD_REQUIRED"
    | "FIELD_INVALID_TYPE"
    | "FIELD_INVALID_VALUE";
  readonly message: string;
};

export type ApiErrorResponse = {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly details?: readonly ApiValidationIssue[];
};

export function configurationError(
  code: ApiErrorCode,
  message: string
): InternalServerErrorException {
  return new InternalServerErrorException(createErrorResponse(code, message));
}

export function forbidden(
  code: ApiErrorCode,
  message: string
): ForbiddenException {
  return new ForbiddenException(createErrorResponse(code, message));
}

export function unauthorized(
  code: ApiErrorCode,
  message: string
): UnauthorizedException {
  return new UnauthorizedException(createErrorResponse(code, message));
}

export function notFound(
  code: ApiErrorCode,
  message: string
): NotFoundException {
  return new NotFoundException(createErrorResponse(code, message));
}

export function badRequest(
  code: ApiErrorCode,
  message: string,
  details?: readonly ApiValidationIssue[]
): BadRequestException {
  return new BadRequestException(createErrorResponse(code, message, details));
}

export function conflict(
  code: ApiErrorCode,
  message: string
): ConflictException {
  return new ConflictException(createErrorResponse(code, message));
}

function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: readonly ApiValidationIssue[]
): ApiErrorResponse {
  if (details === undefined) {
    return {
      code,
      message
    };
  }

  return {
    code,
    message,
    details
  };
}
