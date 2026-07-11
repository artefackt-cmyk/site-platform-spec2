import type { Prisma, PrismaClient } from "@prisma/client";

export type RepositoryPrismaClient = Pick<
  Prisma.TransactionClient,
  | "auditLog"
  | "membership"
  | "mediaAsset"
  | "organization"
  | "pageDocument"
  | "projectPublicationSettings"
  | "project"
  | "publishedPageSnapshot"
  | "publishedPageState"
  | "sitePage"
  | "user"
>;

export type DatabasePrismaClient = PrismaClient;

export type PrismaJsonInput = Prisma.InputJsonValue;
