import type { Prisma, PrismaClient } from "@prisma/client";

export type RepositoryPrismaClient = Pick<
  Prisma.TransactionClient,
  "auditLog" | "membership" | "organization" | "project" | "user"
>;

export type DatabasePrismaClient = PrismaClient;

export type PrismaJsonInput = Prisma.InputJsonValue;
