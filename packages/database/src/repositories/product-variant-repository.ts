import type { TenantContext } from "@site-platform/domain";
import type { PrismaClient, ProductVariant } from "@prisma/client";
import { ProductRepository } from "./product-repository";
import type { RepositoryPrismaClient } from "../types";

export type CreateProductVariantInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly productId: string;
  readonly title: string;
  readonly sku: string;
  readonly priceMinor: number;
  readonly compareAtPriceMinor?: number | null;
  readonly stockQuantity: number;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
  readonly isDefault?: boolean;
  readonly position?: number;
};

export type UpdateProductVariantInput = {
  readonly tenantContext: TenantContext;
  readonly projectId: string;
  readonly productId: string;
  readonly variantId: string;
  readonly title?: string;
  readonly sku?: string;
  readonly priceMinor?: number;
  readonly compareAtPriceMinor?: number | null;
  readonly stockQuantity?: number;
  readonly trackInventory?: boolean;
  readonly allowBackorder?: boolean;
  readonly position?: number;
};

export class ProductVariantRepository {
  constructor(private readonly client: RepositoryPrismaClient) {}

  async listByProduct(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<readonly ProductVariant[]> {
    const product = await new ProductRepository(this.client).findByIdForProject(
      context,
      projectId,
      productId
    );

    if (product === null) {
      return [];
    }

    return this.client.productVariant.findMany({
      where: activeVariantScope(context, projectId, productId),
      orderBy: [
        {
          isDefault: "desc"
        },
        {
          position: "asc"
        },
        {
          createdAt: "asc"
        }
      ]
    });
  }

  async findByIdForProduct(
    context: TenantContext,
    projectId: string,
    productId: string,
    variantId: string
  ): Promise<ProductVariant | null> {
    return this.client.productVariant.findFirst({
      where: {
        ...activeVariantScope(context, projectId, productId),
        id: variantId
      }
    });
  }

  async create(input: CreateProductVariantInput): Promise<ProductVariant | null> {
    const product = await new ProductRepository(this.client).findByIdForProject(
      input.tenantContext,
      input.projectId,
      input.productId
    );

    if (product === null) {
      return null;
    }

    if (input.isDefault === true) {
      return this.runInTransaction((repository) =>
        repository.createInCurrentScope(input)
      );
    }

    return this.createInCurrentScope(input);
  }

  async update(input: UpdateProductVariantInput): Promise<ProductVariant | null> {
    const result = await this.client.productVariant.updateMany({
      where: {
        ...activeVariantScope(
          input.tenantContext,
          input.projectId,
          input.productId
        ),
        id: input.variantId
      },
      data: {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.sku === undefined ? {} : { sku: input.sku }),
        ...(input.priceMinor === undefined ? {} : { priceMinor: input.priceMinor }),
        ...(input.compareAtPriceMinor === undefined
          ? {}
          : { compareAtPriceMinor: input.compareAtPriceMinor }),
        ...(input.stockQuantity === undefined
          ? {}
          : { stockQuantity: input.stockQuantity }),
        ...(input.trackInventory === undefined
          ? {}
          : { trackInventory: input.trackInventory }),
        ...(input.allowBackorder === undefined
          ? {}
          : { allowBackorder: input.allowBackorder }),
        ...(input.position === undefined ? {} : { position: input.position })
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdForProduct(
      input.tenantContext,
      input.projectId,
      input.productId,
      input.variantId
    );
  }

  async softDelete(
    context: TenantContext,
    projectId: string,
    productId: string,
    variantId: string
  ): Promise<ProductVariant | null> {
    const result = await this.client.productVariant.updateMany({
      where: {
        ...activeVariantScope(context, projectId, productId),
        id: variantId
      },
      data: {
        deletedAt: new Date(),
        isDefault: false
      }
    });

    if (result.count === 0) {
      return null;
    }

    return this.client.productVariant.findFirst({
      where: {
        organizationId: context.organizationId,
        projectId,
        productId,
        id: variantId
      }
    });
  }

  async setDefault(
    context: TenantContext,
    projectId: string,
    productId: string,
    variantId: string
  ): Promise<ProductVariant | null> {
    return this.runInTransaction((repository) =>
      repository.setDefaultInCurrentScope(context, projectId, productId, variantId)
    );
  }

  async reorder(
    context: TenantContext,
    projectId: string,
    productId: string,
    orderedVariantIds: readonly string[]
  ): Promise<readonly ProductVariant[]> {
    return this.runInTransaction(async (repository) => {
      for (const [index, variantId] of orderedVariantIds.entries()) {
        await repository.update({
          tenantContext: context,
          projectId,
          productId,
          variantId,
          position: index
        });
      }

      return repository.listByProduct(context, projectId, productId);
    });
  }

  private async createInCurrentScope(
    input: CreateProductVariantInput
  ): Promise<ProductVariant> {
    if (input.isDefault === true) {
      await this.client.productVariant.updateMany({
        where: activeVariantScope(
          input.tenantContext,
          input.projectId,
          input.productId
        ),
        data: {
          isDefault: false
        }
      });
    }

    return this.client.productVariant.create({
      data: {
        organizationId: input.tenantContext.organizationId,
        projectId: input.projectId,
        productId: input.productId,
        title: input.title,
        sku: input.sku,
        priceMinor: input.priceMinor,
        compareAtPriceMinor: input.compareAtPriceMinor ?? null,
        stockQuantity: input.stockQuantity,
        trackInventory: input.trackInventory,
        allowBackorder: input.allowBackorder,
        isDefault: input.isDefault ?? false,
        position: input.position ?? 0,
        currency: "RUB"
      }
    });
  }

  private async setDefaultInCurrentScope(
    context: TenantContext,
    projectId: string,
    productId: string,
    variantId: string
  ): Promise<ProductVariant | null> {
    const variant = await this.findByIdForProduct(
      context,
      projectId,
      productId,
      variantId
    );

    if (variant === null) {
      return null;
    }

    await this.client.productVariant.updateMany({
      where: activeVariantScope(context, projectId, productId),
      data: {
        isDefault: false
      }
    });

    await this.client.productVariant.updateMany({
      where: {
        ...activeVariantScope(context, projectId, productId),
        id: variantId
      },
      data: {
        isDefault: true
      }
    });

    return this.findByIdForProduct(context, projectId, productId, variantId);
  }

  private async runInTransaction<TResult>(
    operation: (repository: ProductVariantRepository) => Promise<TResult>
  ): Promise<TResult> {
    if (hasTransactionSupport(this.client)) {
      return this.client.$transaction((transaction) =>
        operation(new ProductVariantRepository(transaction))
      );
    }

    return operation(this);
  }
}

export function activeVariantScope(
  context: TenantContext,
  projectId: string,
  productId: string
) {
  return {
    organizationId: context.organizationId,
    projectId,
    productId,
    deletedAt: null,
    product: {
      organizationId: context.organizationId,
      projectId,
      deletedAt: null,
      project: {
        organizationId: context.organizationId,
        deletedAt: null
      }
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
