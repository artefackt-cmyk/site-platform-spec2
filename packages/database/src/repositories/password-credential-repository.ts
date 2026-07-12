import type { PasswordCredential } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type CreatePasswordCredentialInput = {
  readonly userId: string;
  readonly passwordHash: string;
};

export class PasswordCredentialRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreatePasswordCredentialInput): Promise<PasswordCredential> {
    return this.client.passwordCredential.create({
      data: {
        userId: input.userId,
        passwordHash: input.passwordHash
      }
    });
  }

  async findByUserId(userId: string): Promise<PasswordCredential | null> {
    return this.client.passwordCredential.findUnique({
      where: {
        userId
      }
    });
  }

  async upsert(input: CreatePasswordCredentialInput): Promise<PasswordCredential> {
    const now = new Date();

    return this.client.passwordCredential.upsert({
      where: {
        userId: input.userId
      },
      create: {
        userId: input.userId,
        passwordHash: input.passwordHash,
        passwordChangedAt: now
      },
      update: {
        passwordHash: input.passwordHash,
        passwordChangedAt: now
      }
    });
  }
}
