import type { AuditLog } from "@prisma/client";
import type { PrismaJsonInput, RepositoryPrismaClient } from "../types";

export type CreateAuditLogInput = {
  readonly organizationId: string;
  readonly actorUserId?: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | null;
  readonly metadata?: PrismaJsonInput | null;
};

export class AuditLogRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    return this.client.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        ...(input.metadata === undefined || input.metadata === null
          ? {}
          : { metadata: input.metadata })
      }
    });
  }

  async listByOrganization(input: {
    readonly organizationId: string;
    readonly limit?: number;
  }): Promise<readonly AuditLog[]> {
    return this.client.auditLog.findMany({
      where: {
        organizationId: input.organizationId
      },
      orderBy: {
        createdAt: "desc"
      },
      ...(input.limit === undefined ? {} : { take: input.limit })
    });
  }
}
