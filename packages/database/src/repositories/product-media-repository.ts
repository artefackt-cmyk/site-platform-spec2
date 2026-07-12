import type { TenantContext } from "@site-platform/domain";
import type { Prisma, PrismaClient } from "@prisma/client";
import { MediaAssetRepository } from "./media-asset-repository";
import { ProductRepository } from "./product-repository";
import type { RepositoryPrismaClient } from "../types";

export const PRODUCT_MEDIA_REPOSITORY_ERROR_CODES = {
  notFound: "PRODUCT_MEDIA_NOT_FOUND",
  duplicate: "PRODUCT_MEDIA_DUPLICATE",
  limitReached: "PRODUCT_MEDIA_LIMIT_REACHED",
  assetInvalid: "PRODUCT_MEDIA_ASSET_INVALID",
  crossProject: "PRODUCT_MEDIA_CROSS_PROJECT",
  primaryInvalid: "PRODUCT_MEDIA_PRIMARY_INVALID"
} as const;

export type ProductMediaRepositoryErrorCode =
  (typeof PRODUCT_MEDIA_REPOSITORY_ERROR_CODES)[keyof typeof PRODUCT_MEDIA_REPOSITORY_ERROR_CODES];

export class ProductMediaRepositoryError extends Error {
  readonly code: ProductMediaRepositoryErrorCode;

  constructor(code: ProductMediaRepositoryErrorCode, message: string) {
    super(message);
    this.name = "ProductMediaRepositoryError";
    this.code = code;
  }
}

export const PRODUCT_MEDIA_LIMIT = 10;

export type ProductMediaWithAsset = Prisma.ProductMediaGetPayload<{
  readonly include: {
    readonly mediaAsset: true;
  };
}>;

export type AddProductMediaInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly productId: string;
  readonly mediaAssetId: string;
  readonly isPrimary?: boolean;
};

export class ProductMediaRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProduct(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<readonly ProductMediaWithAsset[]> {
    const product = await new ProductRepository(this.client).findByIdForProject(
      context,
      projectId,
      productId
    );

    if (product === null) {
      return [];
    }

    return this.client.productMedia.findMany({
      where: activeProductMediaScope(context, projectId, productId),
      include: {
        mediaAsset: true
      },
      orderBy: [
        {
          position: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });
  }

  async add(input: AddProductMediaInput): Promise<ProductMediaWithAsset> {
    return this.runInTransaction((repository) => repository.addInTransaction(input));
  }

  async remove(
    context: TenantContext,
    projectId: string,
    productId: string,
    productMediaId: string
  ): Promise<readonly ProductMediaWithAsset[]> {
    return this.runInTransaction(async (repository) => {
      const current = await repository.findInScope(
        context,
        projectId,
        productId,
        productMediaId
      );

      if (current === null) {
        throw new ProductMediaRepositoryError(
          PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.notFound,
          "Product media was not found."
        );
      }

      await repository.client.productMedia.delete({
        where: {
          id: current.id
        }
      });
      await repository.normalizePositions(context, projectId, productId);

      if (current.isPrimary) {
        await repository.promoteFirstImage(context, projectId, productId);
      }

      return repository.listByProduct(context, projectId, productId);
    });
  }

  async setPrimary(
    context: TenantContext,
    projectId: string,
    productId: string,
    productMediaId: string
  ): Promise<readonly ProductMediaWithAsset[]> {
    return this.runInTransaction(async (repository) => {
      const current = await repository.findInScope(
        context,
        projectId,
        productId,
        productMediaId
      );

      if (current === null) {
        throw new ProductMediaRepositoryError(
          PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.primaryInvalid,
          "Primary product media is invalid."
        );
      }

      await repository.client.productMedia.updateMany({
        where: activeProductMediaScope(context, projectId, productId),
        data: {
          isPrimary: false
        }
      });
      await repository.client.productMedia.update({
        where: {
          id: current.id
        },
        data: {
          isPrimary: true
        }
      });

      return repository.listByProduct(context, projectId, productId);
    });
  }

  async reorder(
    context: TenantContext,
    projectId: string,
    productId: string,
    orderedIds: readonly string[]
  ): Promise<readonly ProductMediaWithAsset[]> {
    return this.runInTransaction(async (repository) => {
      const current = await repository.listByProduct(context, projectId, productId);
      const currentIds = current.map((item) => item.id);

      if (
        orderedIds.length !== currentIds.length ||
        new Set(orderedIds).size !== orderedIds.length ||
        !orderedIds.every((id) => currentIds.includes(id))
      ) {
        throw new ProductMediaRepositoryError(
          PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.notFound,
          "Product media order contains unknown images."
        );
      }

      for (const [position, id] of orderedIds.entries()) {
        await repository.client.productMedia.update({
          where: {
            id
          },
          data: {
            position
          }
        });
      }

      return repository.listByProduct(context, projectId, productId);
    });
  }

  async replaceGallery(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
    readonly productId: string;
    readonly mediaAssetIds: readonly string[];
    readonly primaryMediaAssetId?: string | null;
  }): Promise<readonly ProductMediaWithAsset[]> {
    if (input.mediaAssetIds.length > PRODUCT_MEDIA_LIMIT) {
      throw new ProductMediaRepositoryError(
        PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.limitReached,
        "Product media limit was reached."
      );
    }

    if (new Set(input.mediaAssetIds).size !== input.mediaAssetIds.length) {
      throw new ProductMediaRepositoryError(
        PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.duplicate,
        "Product media asset is already selected."
      );
    }

    return this.runInTransaction(async (repository) => {
      await repository.ensureProductInScope(
        input.tenantContext,
        input.projectId,
        input.productId
      );
      await repository.client.productMedia.deleteMany({
        where: activeProductMediaScope(
          input.tenantContext,
          input.projectId,
          input.productId
        )
      });

      for (const [position, mediaAssetId] of input.mediaAssetIds.entries()) {
        await repository.addInTransaction({
          tenantContext: input.tenantContext,
          projectId: input.projectId,
          productId: input.productId,
          mediaAssetId,
          isPrimary:
            input.primaryMediaAssetId === undefined ||
            input.primaryMediaAssetId === null
              ? position === 0
              : mediaAssetId === input.primaryMediaAssetId
        });
      }

      return repository.listByProduct(
        input.tenantContext,
        input.projectId,
        input.productId
      );
    });
  }

  async createFromLegacyPrimary(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
    readonly productId: string;
    readonly mediaAssetId: string;
  }): Promise<ProductMediaWithAsset> {
    return this.add({
      ...input,
      isPrimary: true
    });
  }

  private async addInTransaction(
    input: AddProductMediaInput
  ): Promise<ProductMediaWithAsset> {
    await this.ensureProductInScope(
      input.tenantContext,
      input.projectId,
      input.productId
    );

    const asset = await new MediaAssetRepository(this.client).findByIdForProject(
      input.tenantContext,
      input.projectId,
      input.mediaAssetId
    );

    if (asset === null) {
      const anyAsset = await this.client.mediaAsset.findUnique({
        where: {
          id: input.mediaAssetId
        }
      });

      throw new ProductMediaRepositoryError(
        anyAsset === null
          ? PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.assetInvalid
          : PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.crossProject,
        "Media asset does not belong to this project."
      );
    }

    const existing = await this.client.productMedia.findFirst({
      where: {
        ...activeProductMediaScope(
          input.tenantContext,
          input.projectId,
          input.productId
        ),
        mediaAssetId: input.mediaAssetId
      }
    });

    if (existing !== null) {
      throw new ProductMediaRepositoryError(
        PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.duplicate,
        "Media asset is already linked to this product."
      );
    }

    const count = await this.client.productMedia.count({
      where: activeProductMediaScope(
        input.tenantContext,
        input.projectId,
        input.productId
      )
    });

    if (count >= PRODUCT_MEDIA_LIMIT) {
      throw new ProductMediaRepositoryError(
        PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.limitReached,
        "Product media limit was reached."
      );
    }

    const shouldBePrimary = count === 0 || input.isPrimary === true;

    if (shouldBePrimary) {
      await this.client.productMedia.updateMany({
        where: activeProductMediaScope(
          input.tenantContext,
          input.projectId,
          input.productId
        ),
        data: {
          isPrimary: false
        }
      });
    }

    return this.client.productMedia.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        productId: input.productId,
        mediaAssetId: input.mediaAssetId,
        position: count,
        isPrimary: shouldBePrimary
      },
      include: {
        mediaAsset: true
      }
    });
  }

  private async ensureProductInScope(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<void> {
    const product = await new ProductRepository(this.client).findByIdForProject(
      context,
      projectId,
      productId
    );

    if (product === null) {
      throw new ProductMediaRepositoryError(
        PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.notFound,
        "Product was not found."
      );
    }
  }

  private async findInScope(
    context: TenantContext,
    projectId: string,
    productId: string,
    productMediaId: string
  ): Promise<ProductMediaWithAsset | null> {
    return this.client.productMedia.findFirst({
      where: {
        ...activeProductMediaScope(context, projectId, productId),
        id: productMediaId
      },
      include: {
        mediaAsset: true
      }
    });
  }

  private async normalizePositions(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<void> {
    const current = await this.listByProduct(context, projectId, productId);

    for (const [position, item] of current.entries()) {
      if (item.position !== position) {
        await this.client.productMedia.update({
          where: {
            id: item.id
          },
          data: {
            position
          }
        });
      }
    }
  }

  private async promoteFirstImage(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<void> {
    const [first] = await this.listByProduct(context, projectId, productId);

    if (first === undefined) {
      return;
    }

    await this.client.productMedia.update({
      where: {
        id: first.id
      },
      data: {
        isPrimary: true
      }
    });
  }

  private async runInTransaction<TResult>(
    operation: (repository: ProductMediaRepository) => Promise<TResult>
  ): Promise<TResult> {
    if (hasTransactionSupport(this.client)) {
      return this.client.$transaction((transaction) =>
        operation(new ProductMediaRepository(transaction))
      );
    }

    return operation(this);
  }
}

export function activeProductMediaScope(
  context: TenantContext,
  projectId: string,
  productId: string
) {
  return {
    organizationId: context.organizationId,
    projectId,
    productId,
    product: {
      organizationId: context.organizationId,
      projectId,
      deletedAt: null,
      project: {
        organizationId: context.organizationId,
        deletedAt: null
      }
    },
    mediaAsset: {
      organizationId: context.organizationId,
      projectId
    }
  };
}

type TransactionCapableClient = RepositoryPrismaClient &
  Pick<PrismaClient, "$transaction">;

function hasTransactionSupport(
  client: RepositoryPrismaClient
): client is TransactionCapableClient {
  return "$transaction" in client;
}
