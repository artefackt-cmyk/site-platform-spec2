import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException
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
  pageNotFound: "PAGE_NOT_FOUND",
  projectSlugAlreadyExists: "PROJECT_SLUG_ALREADY_EXISTS",
  pageSlugAlreadyExists: "PAGE_SLUG_ALREADY_EXISTS",
  pageDocumentInvalid: "PAGE_DOCUMENT_INVALID",
  pageDocumentRevisionConflict: "PAGE_DOCUMENT_REVISION_CONFLICT",
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
  publicHandleReserved: "PUBLIC_HANDLE_RESERVED"
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
