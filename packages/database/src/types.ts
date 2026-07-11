import type { Prisma, PrismaClient } from "@prisma/client";

export type RepositoryPrismaClient = Pick<
  Prisma.TransactionClient,
  | "auditLog"
  | "membership"
  | "organization"
  | "pageDocument"
  | "project"
  | "sitePage"
  | "user"
>;

export type DatabasePrismaClient = PrismaClient;

export type PrismaJsonInput = Prisma.InputJsonValue;
