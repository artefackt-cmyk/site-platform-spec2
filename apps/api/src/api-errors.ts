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
  pageDocumentRevisionConflict: "PAGE_DOCUMENT_REVISION_CONFLICT"
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiValidationIssue = {
  readonly field: string;
  readonly code:
    | DomainErrorCode
    | "DOCUMENT_INVALID"
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
