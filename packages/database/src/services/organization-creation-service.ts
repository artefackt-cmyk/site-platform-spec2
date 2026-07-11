import type { AuditLog, Membership, Organization } from "@prisma/client";
import type { DatabasePrismaClient } from "../types";

export type CreateOrganizationWithOwnerInput = {
  readonly name: string;
  readonly slug: string;
  readonly ownerUserId: string;
  readonly actorUserId?: string | null;
};

export type CreateOrganizationWithOwnerResult = {
  readonly organization: Organization;
  readonly membership: Membership;
  readonly auditLog: AuditLog;
};

export class OrganizationCreationService {
  constructor(private readonly client: DatabasePrismaClient) {}

  async createOrganizationWithOwner(
    input: CreateOrganizationWithOwnerInput
  ): Promise<CreateOrganizationWithOwnerResult> {
    return this.client.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name: input.name,
          slug: input.slug
        }
      });

      const membership = await transaction.membership.create({
        data: {
          userId: input.ownerUserId,
          organizationId: organization.id,
          role: "OWNER"
        }
      });

      const auditLog = await transaction.auditLog.create({
        data: {
          organizationId: organization.id,
          actorUserId: input.actorUserId ?? input.ownerUserId,
          action: "organization.created",
          entityType: "Organization",
          entityId: organization.id,
          metadata: {
            ownerUserId: input.ownerUserId
          }
        }
      });

      return {
        organization,
        membership,
        auditLog
      };
    });
  }
}
