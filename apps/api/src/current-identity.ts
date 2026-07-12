import { Inject, Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import type { AppConfig } from "@site-platform/config";
import {
  AuthSessionRepository,
  MembershipRepository,
  UserRepository,
  type DatabasePrismaClient
} from "@site-platform/database";
import {
  normalizeEmail,
  type OrganizationRole,
  type TenantContext
} from "@site-platform/domain";
import type { Request, Response, NextFunction } from "express";
import {
  API_ERROR_CODES,
  configurationError,
  forbidden,
  notFound,
  unauthorized
} from "./api-errors";
import { APP_CONFIG } from "./app-config.provider";
import { readCookie } from "./cookie-utils";
import { DATABASE_CLIENT } from "./database.provider";
import { hashSecretToken } from "./auth-security";

export type ActiveIdentity = {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
  };
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly membershipId: string;
  readonly role: OrganizationRole;
  readonly tenantContext: TenantContext;
};

export type CurrentIdentityResolver = {
  readonly getCurrentIdentity: () => Promise<ActiveIdentity>;
};

export const CURRENT_IDENTITY_RESOLVER = Symbol("CURRENT_IDENTITY_RESOLVER");
const requestStorage = new AsyncLocalStorage<Request>();
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export function requestContextMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  requestStorage.run(request, next);
}

@Injectable()
export class RequestIdentityService implements CurrentIdentityResolver {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient
  ) {}

  async getCurrentIdentity(): Promise<ActiveIdentity> {
    const request = requestStorage.getStore();
    const sessionToken = readCookie(
      request?.headers.cookie,
      this.config.auth.sessionCookieName
    );

    if (sessionToken !== null) {
      return this.getSessionIdentity(sessionToken);
    }

    if (
      this.config.nodeEnv === "development" &&
      this.config.development.allowDevIdentity
    ) {
      return this.getDevelopmentIdentity();
    }

    throw unauthorized(
      API_ERROR_CODES.authSessionRequired,
      "Authentication session is required."
    );
  }

  private async getSessionIdentity(sessionToken: string): Promise<ActiveIdentity> {
    const sessionRepository = new AuthSessionRepository(this.client);
    const session = await sessionRepository.findByTokenHash(
      hashSecretToken(sessionToken)
    );

    if (session === null) {
      throw unauthorized(
        API_ERROR_CODES.authSessionRequired,
        "Authentication session is required."
      );
    }

    if (session.revokedAt !== null) {
      throw unauthorized(
        API_ERROR_CODES.authSessionRevoked,
        "Authentication session was revoked."
      );
    }

    const now = new Date();

    if (session.expiresAt <= now) {
      await sessionRepository.revoke(session.id, now);
      throw unauthorized(
        API_ERROR_CODES.authSessionExpired,
        "Authentication session expired."
      );
    }

    const request = requestStorage.getStore();

    if (
      session.user.onboardingCompletedAt === null &&
      request?.path !== "/api/auth/session" &&
      request?.path !== "/api/auth/onboarding/complete"
    ) {
      throw forbidden(
        API_ERROR_CODES.authOnboardingRequired,
        "Onboarding must be completed before using this route."
      );
    }

    const membershipRepository = new MembershipRepository(this.client);
    const membership = await membershipRepository.findFirstActiveByUserId(
      session.userId
    );

    if (membership === null) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Authenticated user has no active organization membership."
      );
    }

    await sessionRepository.updateLastSeenThrottled(
      session.id,
      now,
      LAST_SEEN_THROTTLE_MS
    );

    return toActiveIdentity({
      user: session.user,
      membership
    });
  }

  private async getDevelopmentIdentity(): Promise<ActiveIdentity> {
    const devUserEmail = this.config.development.devUserEmail;

    if (devUserEmail === undefined) {
      throw configurationError(
        API_ERROR_CODES.devUserEmailRequired,
        "DEV_USER_EMAIL is required for development dashboard access."
      );
    }

    const userRepository = new UserRepository(this.client);
    const user = await userRepository.findByEmail(normalizeEmail(devUserEmail));

    if (user === null) {
      throw notFound(
        API_ERROR_CODES.devUserNotFound,
        "Development user was not found. Run pnpm db:seed."
      );
    }

    const membershipRepository = new MembershipRepository(this.client);
    const membership = await membershipRepository.findFirstActiveByUserId(user.id);

    if (membership === null) {
      throw notFound(
        API_ERROR_CODES.devMembershipNotFound,
        "Development user has no active organization membership. Run pnpm db:seed."
      );
    }

    return toActiveIdentity({
      user,
      membership
    });
  }
}

function toActiveIdentity(input: {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
  };
  readonly membership: {
    readonly id: string;
    readonly organizationId: string;
    readonly role: string;
    readonly organization: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
    };
  };
}): ActiveIdentity {
  const role = input.membership.role as OrganizationRole;

  return {
    user: {
      id: input.user.id,
      email: input.user.email,
      displayName: input.user.displayName
    },
    organization: {
      id: input.membership.organization.id,
      name: input.membership.organization.name,
      slug: input.membership.organization.slug
    },
    membershipId: input.membership.id,
    role,
    tenantContext: {
      organizationId: input.membership.organizationId,
      userId: input.user.id,
      membershipId: input.membership.id,
      role
    }
  };
}
