import { normalizeEmail } from "@site-platform/domain";
import type { User } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type CreateUserInput = {
  readonly email: string;
  readonly displayName?: string | null;
};

export class UserRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateUserInput): Promise<User> {
    return this.client.user.create({
      data: {
        email: normalizeEmail(input.email),
        displayName: input.displayName ?? null
      }
    });
  }

  async findById(userId: string): Promise<User | null> {
    return this.client.user.findUnique({
      where: {
        id: userId
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.client.user.findUnique({
      where: {
        email: normalizeEmail(email)
      }
    });
  }
}
