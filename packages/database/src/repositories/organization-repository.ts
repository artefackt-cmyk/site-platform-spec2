import type { Organization } from "@prisma/client";
import type { RepositoryPrismaClient } from "../types";

export type CreateOrganizationInput = {
  readonly name: string;
  readonly slug: string;
};

export class OrganizationRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async create(input: CreateOrganizationInput): Promise<Organization> {
    return this.client.organization.create({
      data: {
        name: input.name,
        slug: input.slug
      }
    });
  }

  async findById(organizationId: string): Promise<Organization | null> {
    return this.client.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null
      }
    });
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return this.client.organization.findFirst({
      where: {
        slug,
        deletedAt: null
      }
    });
  }

  async softDelete(organizationId: string): Promise<Organization | null> {
    const result = await this.client.organization.updateMany({
      where: {
        id: organizationId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.client.organization.findUnique({
      where: {
        id: organizationId
      }
    });
  }
}
