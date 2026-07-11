import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "@site-platform/config";
import {
  MembershipRepository,
  UserRepository,
  type DatabasePrismaClient
} from "@site-platform/database";
import {
  normalizeEmail,
  type OrganizationRole,
  type TenantContext
} from "@site-platform/domain";
import { API_ERROR_CODES, configurationError, forbidden, notFound } from "./api-errors";
import { APP_CONFIG } from "./app-config.provider";
import { DATABASE_CLIENT } from "./database.provider";

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

@Injectable()
export class DevelopmentIdentityService implements CurrentIdentityResolver {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient
  ) {}

  async getCurrentIdentity(): Promise<ActiveIdentity> {
    if (this.config.nodeEnv !== "development") {
      throw forbidden(
        API_ERROR_CODES.developmentIdentityDisabled,
        "Development identity is available only when NODE_ENV=development."
      );
    }

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

    const role = membership.role as OrganizationRole;

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug
      },
      membershipId: membership.id,
      role,
      tenantContext: {
        organizationId: membership.organizationId,
        userId: user.id,
        membershipId: membership.id,
        role
      }
    };
  }
}
