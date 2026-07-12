import type { Prisma, PrismaClient } from "@prisma/client";

export type RepositoryPrismaClient = Pick<
  Prisma.TransactionClient,
  | "auditLog"
  | "authSession"
  | "membership"
  | "mediaAsset"
  | "organization"
  | "order"
  | "orderItem"
  | "pageDocument"
  | "projectOrderCounter"
  | "projectPublicationSettings"
  | "product"
  | "productMedia"
  | "productVariant"
  | "passwordCredential"
  | "passwordResetToken"
  | "project"
  | "publishedPageSnapshot"
  | "publishedPageState"
  | "sitePage"
  | "user"
>;

export type DatabasePrismaClient = PrismaClient;

export type PrismaJsonInput = Prisma.InputJsonValue;
