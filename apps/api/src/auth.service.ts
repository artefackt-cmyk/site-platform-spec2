import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "@site-platform/config";
import {
  AuthSessionRepository,
  MembershipRepository,
  PasswordCredentialRepository,
  PasswordResetTokenRepository,
  ProjectRepository,
  UserRepository,
  type DatabasePrismaClient
} from "@site-platform/database";
import {
  AUTH_ERROR_CODES,
  hasPermission,
  normalizeEmail,
  PERMISSIONS,
  validateLoginInput,
  validatePasswordResetConfirmInput,
  validatePasswordResetRequestInput,
  validateRegistrationInput,
  type OrganizationRole
} from "@site-platform/domain";
import type { Request } from "express";
import { API_ERROR_CODES, badRequest, conflict, forbidden, unauthorized } from "./api-errors";
import { APP_CONFIG } from "./app-config.provider";
import {
  generatePasswordResetToken,
  generateSessionToken,
  hashPassword,
  hashSecretToken,
  verifyPassword
} from "./auth-security";
import { readCookie } from "./cookie-utils";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import { DATABASE_CLIENT } from "./database.provider";
import { EMAIL_SENDER, type EmailSender } from "./email-sender";
import { InMemoryRateLimiter } from "./rate-limit";

export type AuthSessionDto = {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
  };
  readonly activeOrganization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly role: OrganizationRole;
  readonly onboarding: {
    readonly completed: boolean;
    readonly completedAt: string | null;
  };
};

export type AuthWithCookieResult = {
  readonly sessionToken: string;
  readonly body: AuthSessionDto;
};

export type PasswordResetRequestResponse = {
  readonly ok: true;
  readonly developmentResetToken?: string;
};

const loginLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);
const registerLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);
const resetLimiter = new InMemoryRateLimiter(5, 15 * 60 * 1000);

@Injectable()
export class AuthService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient,
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender
  ) {}

  async register(body: unknown, request: Request): Promise<AuthWithCookieResult> {
    this.assertRateLimit(registerLimiter, `register:${getClientKey(request)}`);
    const payload = validateRegistrationInput(toRegistrationInput(body));

    if (!payload.ok) {
      throw badRequest(
        payload.code === AUTH_ERROR_CODES.passwordTooWeak
          ? API_ERROR_CODES.authPasswordTooWeak
          : API_ERROR_CODES.validationFailed,
        "Registration input is invalid."
      );
    }

    const existingUser = await new UserRepository(this.client).findByEmail(
      payload.value.email
    );

    if (existingUser !== null) {
      throw conflict(
        API_ERROR_CODES.authEmailAlreadyExists,
        "A user with this email already exists."
      );
    }

    const passwordHash = await hashPassword(payload.value.password);
    const rawSessionToken = generateSessionToken();
    const sessionTokenHash = hashSecretToken(rawSessionToken);
    const expiresAt = createSessionExpiresAt(this.config);

    try {
      const result = await this.client.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email: payload.value.email,
            displayName: payload.value.displayName
          }
        });

        await transaction.passwordCredential.create({
          data: {
            userId: user.id,
            passwordHash
          }
        });

        const organization = await transaction.organization.create({
          data: {
            name: payload.value.organizationName,
            slug: createSlug(payload.value.organizationName, "organization")
          }
        });

        const membership = await transaction.membership.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: "OWNER"
          }
        });

        let project:
          | {
              readonly id: string;
              readonly slug: string;
            }
          | null = null;

        if (payload.value.projectName !== undefined) {
          project = await new ProjectRepository(transaction).create({
            organizationId: organization.id,
            name: payload.value.projectName,
            slug: createSlug(payload.value.projectName, "project"),
            status: "DRAFT"
          });
          const site = await transaction.site.findFirstOrThrow({
            where: {
              projectId: project.id,
              isDefault: true
            }
          });

          await transaction.projectPublicationSettings.create({
            data: {
              organizationId: organization.id,
              projectId: project.id,
              siteId: site.id,
              publicHandle: project.slug
            }
          });
        }

        await transaction.auditLog.create({
          data: {
            organizationId: organization.id,
            actorUserId: user.id,
            action: "USER_REGISTERED",
            entityType: "User",
            entityId: user.id,
            metadata: {
              organizationId: organization.id,
              projectId: project?.id ?? null
            }
          }
        });

        await transaction.authSession.create({
          data: {
            userId: user.id,
            tokenHash: sessionTokenHash,
            expiresAt,
            lastSeenAt: new Date(),
            userAgent: getUserAgent(request),
            ipAddress: getIpAddress(request)
          }
        });

        return {
          user,
          organization,
          membership
        };
      });

      return {
        sessionToken: rawSessionToken,
        body: toAuthSessionDto({
          user: result.user,
          organization: result.organization,
          membership: result.membership
        })
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw conflict(
          API_ERROR_CODES.authEmailAlreadyExists,
          "A user with this email already exists."
        );
      }

      throw error;
    }
  }

  async login(body: unknown, request: Request): Promise<AuthWithCookieResult> {
    const input = toLoginInput(body);
    this.assertRateLimit(loginLimiter, `login:${normalizeEmail(input.email)}:${getClientKey(request)}`);
    const payload = validateLoginInput(input);

    if (!payload.ok) {
      throw invalidCredentials();
    }

    const userRepository = new UserRepository(this.client);
    const user = await userRepository.findByEmail(payload.value.email);
    const credential =
      user === null
        ? null
        : await new PasswordCredentialRepository(this.client).findByUserId(user.id);

    if (
      user === null ||
      credential === null ||
      !(await verifyPassword(credential.passwordHash, payload.value.password))
    ) {
      throw invalidCredentials();
    }

    const membership = await new MembershipRepository(this.client).findFirstActiveByUserId(
      user.id
    );

    if (membership === null) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Authenticated user has no active organization membership."
      );
    }

    const rawSessionToken = generateSessionToken();
    const sessionRepository = new AuthSessionRepository(this.client);

    await sessionRepository.create({
      userId: user.id,
      tokenHash: hashSecretToken(rawSessionToken),
      expiresAt: createSessionExpiresAt(this.config),
      userAgent: getUserAgent(request),
      ipAddress: getIpAddress(request)
    });

    await this.client.auditLog.create({
      data: {
        organizationId: membership.organizationId,
        actorUserId: user.id,
        action: "USER_LOGGED_IN",
        entityType: "User",
        entityId: user.id
      }
    });

    return {
      sessionToken: rawSessionToken,
      body: toAuthSessionDto({
        user,
        organization: membership.organization,
        membership
      })
    };
  }

  async logout(request: Request): Promise<{ readonly ok: true }> {
    const sessionToken = readCookie(
      request.headers.cookie,
      this.config.auth.sessionCookieName
    );

    if (sessionToken === null) {
      return {
        ok: true
      };
    }

    const sessionRepository = new AuthSessionRepository(this.client);
    const session = await sessionRepository.findByTokenHash(hashSecretToken(sessionToken));

    if (session !== null) {
      await sessionRepository.revoke(session.id);
      const membership = await new MembershipRepository(
        this.client
      ).findFirstActiveByUserId(session.userId);

      if (membership !== null) {
        await this.client.auditLog.create({
          data: {
            organizationId: membership.organizationId,
            actorUserId: session.userId,
            action: "USER_LOGGED_OUT",
            entityType: "User",
            entityId: session.userId
          }
        });
      }
    }

    return {
      ok: true
    };
  }

  async getSession(): Promise<AuthSessionDto> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();
    const user = await this.client.user.findUniqueOrThrow({
      where: {
        id: identity.user.id
      }
    });

    return toAuthSessionDto({
      user,
      organization: identity.organization,
      membership: {
        role: identity.role
      }
    });
  }

  async requestPasswordReset(
    body: unknown,
    request: Request
  ): Promise<PasswordResetRequestResponse> {
    const input = toPasswordResetRequestInput(body);
    this.assertRateLimit(resetLimiter, `reset:${normalizeEmail(input.email)}:${getClientKey(request)}`);
    const payload = validatePasswordResetRequestInput(input);

    if (!payload.ok) {
      return {
        ok: true
      };
    }

    const user = await new UserRepository(this.client).findByEmail(payload.value.email);

    if (user === null) {
      return {
        ok: true
      };
    }

    const rawToken = generatePasswordResetToken();
    const resetUrl = createPasswordResetUrl(this.config, rawToken);

    await new PasswordResetTokenRepository(this.client).create({
      userId: user.id,
      tokenHash: hashSecretToken(rawToken),
      expiresAt: new Date(
        Date.now() + this.config.auth.passwordResetTtlMinutes * 60 * 1000
      )
    });

    const membership = await new MembershipRepository(this.client).findFirstActiveByUserId(
      user.id
    );

    if (membership !== null) {
      await this.client.auditLog.create({
        data: {
          organizationId: membership.organizationId,
          actorUserId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          entityType: "User",
          entityId: user.id
        }
      });
    }

    await this.emailSender.sendPasswordReset({
      email: user.email,
      resetUrl,
      ...(this.config.nodeEnv === "development" &&
      this.config.development.exposeDevResetToken
        ? { developmentToken: rawToken }
        : {})
    });

    if (this.config.nodeEnv === "development" && this.config.development.exposeDevResetToken) {
      return {
        ok: true,
        developmentResetToken: rawToken
      };
    }

    return {
      ok: true
    };
  }

  async confirmPasswordReset(
    body: unknown,
    request: Request
  ): Promise<AuthWithCookieResult> {
    const payload = validatePasswordResetConfirmInput(toPasswordResetConfirmInput(body));

    if (!payload.ok) {
      throw badRequest(
        payload.code === AUTH_ERROR_CODES.passwordTooWeak
          ? API_ERROR_CODES.authPasswordTooWeak
          : API_ERROR_CODES.authResetTokenInvalid,
        "Password reset input is invalid."
      );
    }

    const tokenRepository = new PasswordResetTokenRepository(this.client);
    const resetToken = await tokenRepository.findByTokenHash(
      hashSecretToken(payload.value.token)
    );

    if (resetToken === null || resetToken.usedAt !== null) {
      throw unauthorized(
        API_ERROR_CODES.authResetTokenInvalid,
        "Password reset token is invalid."
      );
    }

    if (resetToken.expiresAt <= new Date()) {
      throw unauthorized(
        API_ERROR_CODES.authResetTokenExpired,
        "Password reset token expired."
      );
    }

    const passwordHash = await hashPassword(payload.value.newPassword);
    const rawSessionToken = generateSessionToken();
    const expiresAt = createSessionExpiresAt(this.config);

    const result = await this.client.$transaction(async (transaction) => {
      await new PasswordCredentialRepository(transaction).upsert({
        userId: resetToken.userId,
        passwordHash
      });
      await new PasswordResetTokenRepository(transaction).markUsed(resetToken.id);
      await new AuthSessionRepository(transaction).revokeAllForUser(resetToken.userId);

      const session = await new AuthSessionRepository(transaction).create({
        userId: resetToken.userId,
        tokenHash: hashSecretToken(rawSessionToken),
        expiresAt,
        userAgent: getUserAgent(request),
        ipAddress: getIpAddress(request)
      });
      const user = await transaction.user.findUniqueOrThrow({
        where: {
          id: resetToken.userId
        }
      });
      const membership = await new MembershipRepository(
        transaction
      ).findFirstActiveByUserId(user.id);

      if (membership !== null) {
        await transaction.auditLog.create({
          data: {
            organizationId: membership.organizationId,
            actorUserId: user.id,
            action: "PASSWORD_RESET_COMPLETED",
            entityType: "User",
            entityId: user.id
          }
        });
        await transaction.auditLog.create({
          data: {
            organizationId: membership.organizationId,
            actorUserId: user.id,
            action: "PASSWORD_CHANGED",
            entityType: "User",
            entityId: user.id
          }
        });
      }

      return {
        user,
        membership,
        session
      };
    });

    if (result.membership === null) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Authenticated user has no active organization membership."
      );
    }

    return {
      sessionToken: rawSessionToken,
      body: toAuthSessionDto({
        user: result.user,
        organization: result.membership.organization,
        membership: result.membership
      })
    };
  }

  async completeOnboarding(body: unknown): Promise<AuthSessionDto> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, PERMISSIONS.projectCreate)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission to complete onboarding."
      );
    }

    const projectName = getOptionalString(body, "projectName");

    await this.client.$transaction(async (transaction) => {
      const projectRepository = new ProjectRepository(transaction);
      const projects = await projectRepository.listByOrganization(
        identity.organization.id
      );

      if (projects.length === 0 && projectName !== null) {
        const project = await projectRepository.create({
          organizationId: identity.organization.id,
          name: projectName,
          slug: createSlug(projectName, "project"),
          status: "DRAFT"
        });
        const site = await transaction.site.findFirstOrThrow({
          where: {
            projectId: project.id,
            isDefault: true
          }
        });

        await transaction.projectPublicationSettings.create({
          data: {
            organizationId: identity.organization.id,
            projectId: project.id,
            siteId: site.id,
            publicHandle: project.slug
          }
        });
      }

      await transaction.user.update({
        where: {
          id: identity.user.id
        },
        data: {
          onboardingCompletedAt: new Date()
        }
      });

      await transaction.auditLog.create({
        data: {
          organizationId: identity.organization.id,
          actorUserId: identity.user.id,
          action: "ONBOARDING_COMPLETED",
          entityType: "User",
          entityId: identity.user.id
        }
      });
    });

    return this.getSession();
  }

  private assertRateLimit(limiter: InMemoryRateLimiter, key: string): void {
    const result = limiter.consume(key);

    if (!result.allowed) {
      throw badRequest(
        API_ERROR_CODES.rateLimitExceeded,
        `Too many requests. Retry after ${result.retryAfterSeconds} seconds.`
      );
    }
  }
}

function invalidCredentials(): never {
  throw unauthorized(
    API_ERROR_CODES.authInvalidCredentials,
    "Email or password is incorrect."
  );
}

function toAuthSessionDto(input: {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
    readonly onboardingCompletedAt?: Date | null;
  };
  readonly organization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly membership: {
    readonly role: string;
  };
}): AuthSessionDto {
  const completedAt = input.user.onboardingCompletedAt ?? null;

  return {
    user: {
      id: input.user.id,
      email: input.user.email,
      displayName: input.user.displayName
    },
    activeOrganization: input.organization,
    role: input.membership.role as OrganizationRole,
    onboarding: {
      completed: completedAt !== null,
      completedAt: completedAt?.toISOString() ?? null
    }
  };
}

function createSessionExpiresAt(config: AppConfig): Date {
  return new Date(Date.now() + config.auth.sessionTtlDays * 24 * 60 * 60 * 1000);
}

function createPasswordResetUrl(config: AppConfig, token: string): string {
  const resetUrl = new URL("/reset-password", config.web.dashboardOrigin);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

function toRegistrationInput(body: unknown) {
  return {
    email: getRequiredString(body, "email"),
    password: getRequiredString(body, "password"),
    displayName: getRequiredString(body, "displayName"),
    organizationName: getRequiredString(body, "organizationName"),
    projectName: getOptionalString(body, "projectName") ?? undefined
  };
}

function toLoginInput(body: unknown) {
  return {
    email: getRequiredString(body, "email"),
    password: getRequiredString(body, "password")
  };
}

function toPasswordResetRequestInput(body: unknown) {
  return {
    email: getRequiredString(body, "email")
  };
}

function toPasswordResetConfirmInput(body: unknown) {
  return {
    token: getRequiredString(body, "token"),
    newPassword: getRequiredString(body, "newPassword")
  };
}

function getRequiredString(body: unknown, key: string): string {
  if (isRecord(body) && typeof body[key] === "string") {
    return body[key];
  }

  return "";
}

function getOptionalString(body: unknown, key: string): string | null {
  if (isRecord(body) && typeof body[key] === "string" && body[key].trim() !== "") {
    return body[key].trim().replace(/\s+/g, " ");
  }

  return null;
}

function createSlug(value: string, fallback: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${slug || fallback}-${Date.now().toString(36)}`;
}

function getClientKey(request: Request): string {
  return getIpAddress(request) ?? "unknown";
}

function getUserAgent(request: Request): string | null {
  const userAgent = request.headers["user-agent"];

  return typeof userAgent === "string" ? userAgent.slice(0, 512) : null;
}

function getIpAddress(request: Request): string | null {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.ip ?? null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    isRecord(error) &&
    error.code === "P2002"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
