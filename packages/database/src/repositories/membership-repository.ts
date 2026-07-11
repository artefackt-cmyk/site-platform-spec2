import type {
  Membership,
  Organization,
  OrganizationRole as PrismaOrganizationRole
} from "@prisma/client";
import type { OrganizationRole } from "@site-platform/domain";
import type { RepositoryPrismaClient } from "../types";

export type CreateMembershipInput = {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: OrganizationRole;
};

export type MembershipWithOrganization = Membership & {
  readonly organization: Organization;
};

export class MembershipRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateMembershipInput): Promise<Membership> {
    return this.client.membership.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        role: input.role as PrismaOrganizationRole
      }
    });
  }

  async findByUserAndOrganization(input: {
    readonly userId: string;
    readonly organizationId: string;
  }): Promise<Membership | null> {
    return this.client.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId
        }
      }
    });
  }

  async listByOrganization(organizationId: string): Promise<readonly Membership[]> {
    return this.client.membership.findMany({
      where: {
        organizationId
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async findFirstActiveByUserId(
    userId: string
  ): Promise<MembershipWithOrganization | null> {
    return this.client.membership.findFirst({
      where: {
        userId,
        organization: {
          deletedAt: null
        }
      },
      include: {
        organization: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }
}
