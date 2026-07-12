import type { PasswordResetToken } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type CreatePasswordResetTokenInput = {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
};

export class PasswordResetTokenRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken> {
    return this.client.passwordResetToken.create({
      data: input
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.client.passwordResetToken.findUnique({
      where: {
        tokenHash
      }
    });
  }

  async markUsed(tokenId: string, usedAt = new Date()): Promise<boolean> {
    const result = await this.client.passwordResetToken.updateMany({
      where: {
        id: tokenId,
        usedAt: null
      },
      data: {
        usedAt
      }
    });

    return result.count === 1;
  }
}
