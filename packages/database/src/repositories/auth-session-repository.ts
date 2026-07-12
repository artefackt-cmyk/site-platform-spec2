import type { AuthSession, User } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type AuthSessionWithUser = AuthSession & {
  readonly user: User;
};

export type CreateAuthSessionInput = {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
};

export class AuthSessionRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateAuthSessionInput): Promise<AuthSession> {
    const now = new Date();

    return this.client.authSession.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        lastSeenAt: now,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null
      }
    });
  }

  async findByTokenHash(tokenHash: string): Promise<AuthSessionWithUser | null> {
    return this.client.authSession.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: true
      }
    });
  }

  async revoke(sessionId: string, revokedAt = new Date()): Promise<void> {
    await this.client.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null
      },
      data: {
        revokedAt
      }
    });
  }

  async revokeAllForUser(userId: string, revokedAt = new Date()): Promise<void> {
    await this.client.authSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt
      }
    });
  }

  async revokeExpired(now = new Date()): Promise<number> {
    const result = await this.client.authSession.updateMany({
      where: {
        expiresAt: {
          lte: now
        },
        revokedAt: null
      },
      data: {
        revokedAt: now
      }
    });

    return result.count;
  }

  async updateLastSeenThrottled(
    sessionId: string,
    lastSeenAt: Date,
    throttleMs: number
  ): Promise<void> {
    await this.client.authSession.updateMany({
      where: {
        id: sessionId,
        lastSeenAt: {
          lt: new Date(lastSeenAt.getTime() - throttleMs)
        },
        revokedAt: null
      },
      data: {
        lastSeenAt
      }
    });
  }
}
