import type { TenantContext } from "@site-platform/domain";
import type { PrismaClient, Product, ProductStatus } from "@prisma/client";
import { MediaAssetRepository } from "./media-asset-repository";
import { ProjectRepository } from "./project-repository";
import type { RepositoryPrismaClient } from "../types";

export type ProductWithPrimaryMedia = Product & {
  readonly primaryMediaAsset: {
    readonly id: string;
    readonly mimeType: string;
    readonly storageKey: string;
    readonly altText: string | null;
    readonly width: number | null;
    readonly height: number | null;
  } | null;
};

export type CreateProductInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription?: string | null;
  readonly description?: string | null;
  readonly primaryMediaAssetId?: string | null;
  readonly createdByUserId: string;
  readonly updatedByUserId: string;
  readonly status?: ProductStatus;
};

export type UpdateProductInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly productId: string;
  readonly title?: string;
  readonly slug?: string;
  readonly shortDescription?: string | null;
  readonly description?: string | null;
  readonly primaryMediaAssetId?: string | null;
  readonly updatedByUserId: string;
};

export type ListProductsInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly status?: ProductStatus;
  readonly search?: string;
  readonly limit?: number;
};

export class ProductRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProject(input: ListProductsInput): Promise<readonly Product[]> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: input.tenantContext,
      projectId: input.projectId
    });

    if (project === null) {
      return [];
    }

    return this.client.product.findMany({
      where: {
        ...activeProductScope(input.tenantContext, input.projectId),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.search === undefined || input.search.trim() === ""
          ? {}
          : {
              title: {
                contains: input.search.trim(),
                mode: "insensitive"
              }
            })
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: input.limit ?? 50
    });
  }

  async listActivePublicByHandle(
    publicHandle: string
  ): Promise<readonly ProductWithPrimaryMedia[]> {
    const settings = await this.client.projectPublicationSettings.findUnique({
      where: {
        publicHandle
      }
    });

    if (settings === null) {
      return [];
    }

    return this.client.product.findMany({
      where: publicActiveProductScope(settings.projectId),
      include: {
        primaryMediaAsset: {
          select: {
            id: true,
            mimeType: true,
            storageKey: true,
            altText: true,
            width: true,
            height: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async findByIdForProject(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<Product | null> {
    return this.client.product.findFirst({
      where: {
        ...activeProductScope(context, projectId),
        id: productId
      }
    });
  }

  async findBySlugForProject(
    context: TenantContext,
    projectId: string,
    slug: string
  ): Promise<Product | null> {
    return this.client.product.findFirst({
      where: {
        ...activeProductScope(context, projectId),
        slug
      }
    });
  }

  async findActivePublicByHandleAndSlug(input: {
    readonly publicHandle: string;
    readonly productSlug: string;
  }): Promise<ProductWithPrimaryMedia | null> {
    return this.client.product.findFirst({
      where: {
        slug: input.productSlug,
        ...publicActiveProductScope(undefined),
        project: {
          deletedAt: null,
          publicationSettings: {
            publicHandle: input.publicHandle
          }
        }
      },
      include: {
        primaryMediaAsset: {
          select: {
            id: true,
            mimeType: true,
            storageKey: true,
            altText: true,
            width: true,
            height: true
          }
        }
      }
    });
  }

  async create(input: CreateProductInput): Promise<Product | null> {
    const project = await new ProjectRepository(
      this.client
    ).findByTenantContextAndId({
      tenantContext: input.tenantContext,
      projectId: input.projectId
    });

    if (project === null) {
      return null;
    }

    if (
      input.primaryMediaAssetId !== undefined &&
      input.primaryMediaAssetId !== null
    ) {
      const asset = await new MediaAssetRepository(this.client).findByIdForProject(
        input.tenantContext,
        input.projectId,
        input.primaryMediaAssetId
      );

      if (asset === null) {
        return null;
      }
    }

    return this.client.product.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        title: input.title,
        slug: input.slug,
        shortDescription: input.shortDescription ?? null,
        description: input.description ?? null,
        primaryMediaAssetId: input.primaryMediaAssetId ?? null,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId,
        ...(input.status === undefined ? {} : { status: input.status })
      }
    });
  }

  async update(input: UpdateProductInput): Promise<Product | null> {
    if (
      input.primaryMediaAssetId !== undefined &&
      input.primaryMediaAssetId !== null
    ) {
      const asset = await new MediaAssetRepository(this.client).findByIdForProject(
        input.tenantContext,
        input.projectId,
        input.primaryMediaAssetId
      );

      if (asset === null) {
        return null;
      }
    }

    const result = await this.client.product.updateMany({
      where: {
        ...activeProductScope(input.tenantContext, input.projectId),
        id: input.productId
      },
      data: {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.slug === undefined ? {} : { slug: input.slug }),
        ...(input.shortDescription === undefined
          ? {}
          : { shortDescription: input.shortDescription }),
        ...(input.description === undefined
          ? {}
          : { description: input.description }),
        ...(input.primaryMediaAssetId === undefined
          ? {}
          : { primaryMediaAssetId: input.primaryMediaAssetId }),
        updatedByUserId: input.updatedByUserId
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForProject(
      input.tenantContext,
      input.projectId,
      input.productId
    );
  }

  async activate(
    context: TenantContext,
    projectId: string,
    productId: string,
    updatedByUserId: string
  ): Promise<Product | null> {
    return this.updateStatus(context, projectId, productId, "ACTIVE", updatedByUserId);
  }

  async archive(
    context: TenantContext,
    projectId: string,
    productId: string,
    updatedByUserId: string
  ): Promise<Product | null> {
    return this.updateStatus(
      context,
      projectId,
      productId,
      "ARCHIVED",
      updatedByUserId
    );
  }

  async softDelete(
    context: TenantContext,
    projectId: string,
    productId: string,
    updatedByUserId: string
  ): Promise<Product | null> {
    const result = await this.client.product.updateMany({
      where: {
        ...activeProductScope(context, projectId),
        id: productId
      },
      data: {
        deletedAt: new Date(),
        updatedByUserId
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.client.product.findFirst({
      where: {
        organizationId: context.organizationId,
        projectId,
        id: productId
      }
    });
  }

  private async updateStatus(
    context: TenantContext,
    projectId: string,
    productId: string,
    status: ProductStatus,
    updatedByUserId: string
  ): Promise<Product | null> {
    const result = await this.client.product.updateMany({
      where: {
        ...activeProductScope(context, projectId),
        id: productId
      },
      data: {
        status,
        updatedByUserId
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForProject(context, projectId, productId);
  }
}

export function activeProductScope(context: TenantContext, projectId: string) {
  return {
    organizationId: context.organizationId,
    projectId,
    deletedAt: null,
    project: {
      organizationId: context.organizationId,
      deletedAt: null
    }
  };
}

function publicActiveProductScope(projectId: string | undefined) {
  return {
    ...(projectId === undefined ? {} : { projectId }),
    status: "ACTIVE" as const,
    deletedAt: null,
    project: {
      deletedAt: null
    }
  };
}

export type TransactionCapableClient = RepositoryPrismaClient &
  Pick<PrismaClient, "$transaction">;
