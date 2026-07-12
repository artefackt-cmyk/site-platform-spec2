import { Inject, Injectable } from "@nestjs/common";
import type { AppConfig } from "@site-platform/config";
import {
  AuditLogRepository,
  MediaAssetRepository,
  PRODUCT_MEDIA_REPOSITORY_ERROR_CODES,
  ProductMediaRepository,
  ProductMediaRepositoryError,
  ProductRepository,
  ProductVariantRepository,
  type DatabasePrismaClient,
  type MediaAsset,
  type Product,
  type ProductMediaWithAsset,
  type ProductStatus,
  type ProductVariant
} from "@site-platform/database";
import {
  DOMAIN_ERROR_CODES,
  PERMISSIONS,
  formatRubMoney,
  getProductAvailability,
  hasPermission,
  validateCompareAtPriceMinor,
  validateMoneyMinor,
  validateProductSlug,
  validateProductTitle,
  validateStockQuantity,
  validateVariantSku,
  validateVariantTitle,
  type DomainErrorCode,
  type Permission,
  type TenantContext
} from "@site-platform/domain";
import { APP_CONFIG } from "./app-config.provider";
import {
  API_ERROR_CODES,
  badRequest,
  conflict,
  forbidden,
  notFound,
  type ApiValidationIssue
} from "./api-errors";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";
import { DATABASE_CLIENT } from "./database.provider";
import { createPublicMediaUrl } from "./publication.service";

export type ProductSummaryResponse = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: ProductStatus;
  readonly primaryImage: ProductImageResponse | null;
  readonly defaultPrice: ProductMoneyResponse | null;
  readonly variantsCount: number;
  readonly stockSummary: ProductAvailabilityResponse;
  readonly updatedAt: string;
};

export type ProductDetailResponse = {
  readonly product: ProductResponse;
  readonly variants: readonly ProductVariantResponse[];
};

export type ProductsListResponse = {
  readonly products: readonly ProductSummaryResponse[];
};

export type ProductResponse = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly status: ProductStatus;
  readonly primaryImage: ProductImageResponse | null;
  readonly images: readonly ProductGalleryImageResponse[];
  readonly updatedAt: string;
};

export type ProductVariantResponse = {
  readonly id: string;
  readonly title: string;
  readonly sku: string;
  readonly price: ProductMoneyResponse;
  readonly compareAtPrice: ProductMoneyResponse | null;
  readonly stockQuantity: number;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
  readonly availability: ProductAvailabilityResponse;
  readonly isDefault: boolean;
  readonly position: number;
};

export type ProductImageResponse = {
  readonly assetId: string;
  readonly url: string;
  readonly altText: string | null;
  readonly width: number | null;
  readonly height: number | null;
};

export type ProductGalleryImageResponse = ProductImageResponse & {
  readonly id: string;
  readonly position: number;
  readonly isPrimary: boolean;
};

export type ProductMediaListResponse = {
  readonly images: readonly ProductGalleryImageResponse[];
};

export type ProductMoneyResponse = {
  readonly amountMinor: number;
  readonly currency: "RUB";
  readonly formatted: string;
};

export type ProductAvailabilityResponse =
  | "in-stock"
  | "out-of-stock"
  | "preorder";

export type PublicCatalogListResponse = {
  readonly products: readonly PublicProductSummaryResponse[];
};

export type PublicProductSummaryResponse = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly primaryImage: ProductImageResponse | null;
  readonly images: readonly ProductGalleryImageResponse[];
  readonly price: ProductMoneyResponse | null;
  readonly availability: ProductAvailabilityResponse;
  readonly defaultVariant: ProductVariantResponse | null;
  readonly publicUrl: string;
};

export type PublicProductDetailResponse = PublicProductSummaryResponse & {
  readonly description: string | null;
  readonly variants: readonly ProductVariantResponse[];
  readonly defaultVariant: ProductVariantResponse | null;
  readonly canonicalUrl: string;
};

@Injectable()
export class ProductService {
  constructor(
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver,
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {}

  async listProducts(
    projectId: string,
    query: Record<string, string | undefined>
  ): Promise<ProductsListResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentRead);
    const status = parseProductStatus(query.status);
    const products = await new ProductRepository(this.client).listByProject({
      tenantContext: identity.tenantContext,
      projectId,
      ...(status === undefined ? {} : { status }),
      ...(query.search === undefined ? {} : { search: query.search }),
      limit: parseLimit(query.limit)
    });

    return {
      products: await Promise.all(
        products.map((product) =>
          this.toProductSummary(identity.tenantContext, projectId, product)
        )
      )
    };
  }

  async createProduct(
    projectId: string,
    body: unknown
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const payload = parseCreateProductPayload(body);

    try {
      const product = await this.client.$transaction(async (transaction) => {
        const productRepository = new ProductRepository(transaction);
        const variantRepository = new ProductVariantRepository(transaction);
        const productMediaRepository = new ProductMediaRepository(transaction);
        const auditRepository = new AuditLogRepository(transaction);
        const createdProduct = await productRepository.create({
          tenantContext: identity.tenantContext,
          projectId,
          title: payload.title,
          slug: payload.slug,
          shortDescription: payload.shortDescription,
          createdByUserId: identity.user.id,
          updatedByUserId: identity.user.id
        });

        if (createdProduct === null) {
          throw productNotFoundError();
        }

        const variant = await variantRepository.create({
          tenantContext: identity.tenantContext,
          projectId,
          productId: createdProduct.id,
          title: "Основной вариант",
          sku: payload.sku,
          priceMinor: payload.priceMinor,
          stockQuantity: payload.stockQuantity,
          compareAtPriceMinor: null,
          trackInventory: true,
          allowBackorder: false,
          isDefault: true,
          position: 0
        });

        if (variant === null) {
          throw productNotFoundError();
        }

        await productMediaRepository.replaceGallery({
          tenantContext: identity.tenantContext,
          projectId,
          productId: createdProduct.id,
          mediaAssetIds: payload.mediaAssetIds,
          primaryMediaAssetId: payload.primaryMediaAssetId
        });

        await auditRepository.create({
          organizationId: identity.tenantContext.organizationId,
          actorUserId: identity.user.id,
          action: "product.created",
          entityType: "Product",
          entityId: createdProduct.id,
          metadata: {
            projectId,
            title: createdProduct.title,
            slug: createdProduct.slug
          }
        });

        return createdProduct;
      });

      return this.getProduct(projectId, product.id);
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async getProduct(
    projectId: string,
    productId: string
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentRead);
    const product = await this.getProductOrThrow(
      identity.tenantContext,
      projectId,
      productId
    );
    const variants = await new ProductVariantRepository(this.client).listByProduct(
      identity.tenantContext,
      projectId,
      productId
    );

    return {
      product: await this.toProductResponse(identity.tenantContext, projectId, product),
      variants: variants.map(toVariantResponse)
    };
  }

  async updateProduct(
    projectId: string,
    productId: string,
    body: unknown
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const payload = parseUpdateProductPayload(body);

    try {
      const product = await new ProductRepository(this.client).update({
        tenantContext: identity.tenantContext,
        projectId,
        productId,
        updatedByUserId: identity.user.id,
        ...payload
      });

      if (product === null) {
        throw productNotFoundError();
      }

      await new AuditLogRepository(this.client).create({
        organizationId: identity.tenantContext.organizationId,
        actorUserId: identity.user.id,
        action: "product.updated",
        entityType: "Product",
        entityId: product.id,
        metadata: {
          projectId
        }
      });

      return this.getProduct(projectId, product.id);
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async activateProduct(
    projectId: string,
    productId: string
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const product = await this.getProductOrThrow(
      identity.tenantContext,
      projectId,
      productId
    );
    const variants = await new ProductVariantRepository(this.client).listByProduct(
      identity.tenantContext,
      projectId,
      productId
    );
    const activationIssues = validateActivation(product, variants);

    if (activationIssues.length > 0) {
      throw badRequest(
        API_ERROR_CODES.productCannotActivate,
        "Product cannot be activated.",
        activationIssues
      );
    }

    const activated = await new ProductRepository(this.client).activate(
      identity.tenantContext,
      projectId,
      productId,
      identity.user.id
    );

    if (activated === null) {
      throw productNotFoundError();
    }

    await new AuditLogRepository(this.client).create({
      organizationId: identity.tenantContext.organizationId,
      actorUserId: identity.user.id,
      action: "product.activated",
      entityType: "Product",
      entityId: activated.id,
      metadata: {
        projectId
      }
    });

    return this.getProduct(projectId, productId);
  }

  async archiveProduct(
    projectId: string,
    productId: string
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const product = await new ProductRepository(this.client).archive(
      identity.tenantContext,
      projectId,
      productId,
      identity.user.id
    );

    if (product === null) {
      throw productNotFoundError();
    }

    await new AuditLogRepository(this.client).create({
      organizationId: identity.tenantContext.organizationId,
      actorUserId: identity.user.id,
      action: "product.archived",
      entityType: "Product",
      entityId: product.id,
      metadata: {
        projectId
      }
    });

    return this.getProduct(projectId, productId);
  }

  async deleteProduct(
    projectId: string,
    productId: string
  ): Promise<{ readonly deleted: true }> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const product = await new ProductRepository(this.client).softDelete(
      identity.tenantContext,
      projectId,
      productId,
      identity.user.id
    );

    if (product === null) {
      throw productNotFoundError();
    }

    await new AuditLogRepository(this.client).create({
      organizationId: identity.tenantContext.organizationId,
      actorUserId: identity.user.id,
      action: "product.deleted",
      entityType: "Product",
      entityId: product.id,
      metadata: {
        projectId
      }
    });

    return {
      deleted: true
    };
  }

  async createVariant(
    projectId: string,
    productId: string,
    body: unknown
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const payload = parseVariantPayload(body, false);
    const variants = await new ProductVariantRepository(this.client).listByProduct(
      identity.tenantContext,
      projectId,
      productId
    );

    try {
      const variant = await new ProductVariantRepository(this.client).create({
        tenantContext: identity.tenantContext,
        projectId,
        productId,
        ...payload,
        isDefault: variants.length === 0 || payload.isDefault === true,
        position: variants.length
      });

      if (variant === null) {
        throw productNotFoundError();
      }

      return this.getProduct(projectId, productId);
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async updateVariant(
    projectId: string,
    productId: string,
    variantId: string,
    body: unknown
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const payload = parseVariantPayload(body, true);

    try {
      const variant = await new ProductVariantRepository(this.client).update({
        tenantContext: identity.tenantContext,
        projectId,
        productId,
        variantId,
        ...payload
      });

      if (variant === null) {
        throw variantNotFoundError();
      }

      return this.getProduct(projectId, productId);
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async deleteVariant(
    projectId: string,
    productId: string,
    variantId: string
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const repository = new ProductVariantRepository(this.client);
    const variants = await repository.listByProduct(
      identity.tenantContext,
      projectId,
      productId
    );
    const variant = variants.find((item) => item.id === variantId) ?? null;

    if (variant === null) {
      throw variantNotFoundError();
    }

    if (variants.length <= 1) {
      throw badRequest(
        API_ERROR_CODES.cannotDeleteOnlyVariant,
        "Cannot delete the only product variant."
      );
    }

    if (variant.isDefault) {
      throw badRequest(
        API_ERROR_CODES.cannotDeleteDefaultVariant,
        "Cannot delete the default product variant."
      );
    }

    await repository.softDelete(
      identity.tenantContext,
      projectId,
      productId,
      variantId
    );

    return this.getProduct(projectId, productId);
  }

  async setDefaultVariant(
    projectId: string,
    productId: string,
    variantId: string
  ): Promise<ProductDetailResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const variant = await new ProductVariantRepository(this.client).setDefault(
      identity.tenantContext,
      projectId,
      productId,
      variantId
    );

    if (variant === null) {
      throw variantNotFoundError();
    }

    return this.getProduct(projectId, productId);
  }

  async listProductMedia(
    projectId: string,
    productId: string
  ): Promise<ProductMediaListResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentRead);

    return {
      images: await this.getProductImages(
        identity.tenantContext,
        projectId,
        productId
      )
    };
  }

  async addProductMedia(
    projectId: string,
    productId: string,
    body: unknown
  ): Promise<ProductMediaListResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const mediaAssetId = parseMediaAssetIdPayload(body);

    try {
      await new ProductMediaRepository(this.client).add({
        tenantContext: identity.tenantContext,
        projectId,
        productId,
        mediaAssetId
      });
      await this.writeProductMediaAuditLog(
        identity.tenantContext,
        identity.user.id,
        projectId,
        productId,
        "add"
      );

      return this.listProductMedia(projectId, productId);
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async removeProductMedia(
    projectId: string,
    productId: string,
    productMediaId: string
  ): Promise<ProductMediaListResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);

    try {
      const images = await new ProductMediaRepository(this.client).remove(
        identity.tenantContext,
        projectId,
        productId,
        productMediaId
      );
      await this.writeProductMediaAuditLog(
        identity.tenantContext,
        identity.user.id,
        projectId,
        productId,
        "remove"
      );

      return {
        images: images.map((image) => toProductGalleryImage(this.config, image))
      };
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async setPrimaryProductMedia(
    projectId: string,
    productId: string,
    productMediaId: string
  ): Promise<ProductMediaListResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);

    try {
      const images = await new ProductMediaRepository(this.client).setPrimary(
        identity.tenantContext,
        projectId,
        productId,
        productMediaId
      );
      await this.writeProductMediaAuditLog(
        identity.tenantContext,
        identity.user.id,
        projectId,
        productId,
        "set-primary"
      );

      return {
        images: images.map((image) => toProductGalleryImage(this.config, image))
      };
    } catch (error) {
      throw mapProductError(error);
    }
  }

  async reorderProductMedia(
    projectId: string,
    productId: string,
    body: unknown
  ): Promise<ProductMediaListResponse> {
    const identity = await this.requirePermission(PERMISSIONS.contentUpdate);
    const orderedIds = parseOrderedIdsPayload(body);

    try {
      const images = await new ProductMediaRepository(this.client).reorder(
        identity.tenantContext,
        projectId,
        productId,
        orderedIds
      );
      await this.writeProductMediaAuditLog(
        identity.tenantContext,
        identity.user.id,
        projectId,
        productId,
        "reorder"
      );

      return {
        images: images.map((image) => toProductGalleryImage(this.config, image))
      };
    } catch (error) {
      throw mapProductError(error);
    }
  }

  private async toProductSummary(
    context: TenantContext,
    projectId: string,
    product: Product
  ): Promise<ProductSummaryResponse> {
    const [variants, productResponse] = await Promise.all([
      new ProductVariantRepository(this.client).listByProduct(
        context,
        projectId,
        product.id
      ),
      this.toProductResponse(context, projectId, product)
    ]);
    const defaultVariant = getDefaultVariant(variants);

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      status: product.status,
      primaryImage: productResponse.primaryImage,
      defaultPrice:
        defaultVariant === null ? null : toMoneyResponse(defaultVariant.priceMinor),
      variantsCount: variants.length,
      stockSummary:
        defaultVariant === null ? "out-of-stock" : toAvailability(defaultVariant),
      updatedAt: product.updatedAt.toISOString()
    };
  }

  private async toProductResponse(
    context: TenantContext,
    projectId: string,
    product: Product
  ): Promise<ProductResponse> {
    const images = await this.getProductImages(context, projectId, product.id);
    const compatibilityPrimary =
      images.length > 0 || product.primaryMediaAssetId === null
        ? null
        : await new MediaAssetRepository(this.client).findByIdForProject(
            context,
            projectId,
            product.primaryMediaAssetId
          );
    const primaryImage =
      images.find((image) => image.isPrimary) ??
      images[0] ??
      (compatibilityPrimary === null
        ? null
        : toProductImage(this.config, compatibilityPrimary));

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      status: product.status,
      primaryImage,
      images,
      updatedAt: product.updatedAt.toISOString()
    };
  }

  private async getProductImages(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<readonly ProductGalleryImageResponse[]> {
    const images = await new ProductMediaRepository(this.client).listByProduct(
      context,
      projectId,
      productId
    );

    return images.map((image) => toProductGalleryImage(this.config, image));
  }

  private async writeProductMediaAuditLog(
    context: TenantContext,
    actorUserId: string,
    projectId: string,
    productId: string,
    operation: string
  ): Promise<void> {
    await new AuditLogRepository(this.client).create({
      organizationId: context.organizationId,
      actorUserId,
      action: "product.updated",
      entityType: "Product",
      entityId: productId,
      metadata: {
        projectId,
        productMedia: operation
      }
    });
  }

  private async getProductOrThrow(
    context: TenantContext,
    projectId: string,
    productId: string
  ): Promise<Product> {
    const product = await new ProductRepository(this.client).findByIdForProject(
      context,
      projectId,
      productId
    );

    if (product === null) {
      throw productNotFoundError();
    }

    return product;
  }

  private async requirePermission(permission: Permission) {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    if (!hasPermission(identity.role, permission)) {
      throw forbidden(
        API_ERROR_CODES.permissionDenied,
        "Current user does not have permission for product catalog operation."
      );
    }

    return identity;
  }
}

@Injectable()
export class PublicCatalogService {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabasePrismaClient,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {}

  async listProducts(publicHandle: string): Promise<PublicCatalogListResponse> {
    const products = await new ProductRepository(this.client).listActivePublicByHandle(
      publicHandle
    );

    return {
      products: await Promise.all(
        products.map((product) => this.toPublicProductSummary(publicHandle, product))
      )
    };
  }

  async getProduct(
    publicHandle: string,
    productSlug: string
  ): Promise<PublicProductDetailResponse> {
    const product = await new ProductRepository(
      this.client
    ).findActivePublicByHandleAndSlug({
      publicHandle,
      productSlug
    });

    if (product === null) {
      throw notFound(API_ERROR_CODES.productNotFound, "Product was not found.");
    }

    const variants = await this.client.productVariant.findMany({
      where: {
        organizationId: product.organizationId,
        projectId: product.projectId,
        productId: product.id,
        deletedAt: null
      },
      orderBy: [
        {
          isDefault: "desc"
        },
        {
          position: "asc"
        }
      ]
    });
    const summary = await this.toPublicProductSummary(publicHandle, product);
    const variantResponses = variants.map(toVariantResponse);

    return {
      ...summary,
      description: product.description,
      variants: variantResponses,
      defaultVariant: variantResponses.find((variant) => variant.isDefault) ?? null,
      canonicalUrl: createPublicProductUrl(this.config, publicHandle, product.slug)
    };
  }

  private async toPublicProductSummary(
    publicHandle: string,
    product: Product & {
      readonly primaryMediaAsset: {
        readonly id: string;
        readonly mimeType: string;
        readonly storageKey: string;
        readonly altText: string | null;
        readonly width?: number | null;
        readonly height?: number | null;
      } | null;
    }
  ): Promise<PublicProductSummaryResponse> {
    const defaultVariant = await this.client.productVariant.findFirst({
      where: {
        organizationId: product.organizationId,
        projectId: product.projectId,
        productId: product.id,
        deletedAt: null,
        isDefault: true
      }
    });
    const publicContext = {
      organizationId: product.organizationId,
      userId: "public",
      membershipId: "public",
      role: "VIEWER"
    } as const;
    const images = await new ProductMediaRepository(this.client).listByProduct(
      publicContext,
      product.projectId,
      product.id
    );
    const imageResponses = images.map((image) =>
      toProductGalleryImage(this.config, image)
    );
    const compatibilityPrimary =
      imageResponses.length > 0 || product.primaryMediaAsset === null
        ? null
        : toProductImage(this.config, {
            id: product.primaryMediaAsset.id,
            storageKey: product.primaryMediaAsset.storageKey,
            originalFilename: "",
            mimeType: product.primaryMediaAsset.mimeType,
            sizeBytes: 0,
            width: product.primaryMediaAsset.width ?? null,
            height: product.primaryMediaAsset.height ?? null,
            altText: product.primaryMediaAsset.altText,
            organizationId: product.organizationId,
            projectId: product.projectId,
            createdByUserId: product.createdByUserId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          });

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      shortDescription: product.shortDescription,
      primaryImage:
        imageResponses.find((image) => image.isPrimary) ??
        imageResponses[0] ??
        compatibilityPrimary,
      images: imageResponses,
      price: defaultVariant === null ? null : toMoneyResponse(defaultVariant.priceMinor),
      availability:
        defaultVariant === null ? "out-of-stock" : toAvailability(defaultVariant),
      defaultVariant: defaultVariant === null ? null : toVariantResponse(defaultVariant),
      publicUrl: createPublicProductUrl(this.config, publicHandle, product.slug)
    };
  }
}

export function createPublicProductPath(
  publicHandle: string,
  productSlug?: string
): string {
  const basePath = `/s/${encodeURIComponent(publicHandle)}/products`;

  return productSlug === undefined
    ? basePath
    : `${basePath}/${encodeURIComponent(productSlug)}`;
}

export function createPublicProductUrl(
  config: AppConfig,
  publicHandle: string,
  productSlug?: string
): string {
  return `${config.web.publicStorefrontUrl.replace(
    /\/$/,
    ""
  )}${createPublicProductPath(publicHandle, productSlug)}`;
}

function parseCreateProductPayload(body: unknown) {
  const record = requireRecord(body);
  const title = parseProductTitle(record.title);
  const slug = parseProductSlug(record.slug);
  const priceMinor = parsePrice(record.priceMinor);
  const sku = parseSku(record.sku);
  const stockQuantity =
    record.stockQuantity === undefined ? 0 : parseStock(record.stockQuantity);
  const mediaAssetIds =
    record.mediaAssetIds === undefined ? [] : parseMediaAssetIds(record.mediaAssetIds);
  const primaryMediaAssetId =
    record.primaryMediaAssetId === undefined
      ? mediaAssetIds[0] ?? null
      : parseOptionalId(record.primaryMediaAssetId);

  if (
    primaryMediaAssetId !== null &&
    mediaAssetIds.length > 0 &&
    !mediaAssetIds.includes(primaryMediaAssetId)
  ) {
    throw badRequest(
      API_ERROR_CODES.productMediaPrimaryInvalid,
      "Primary product media is invalid."
    );
  }

  return {
    title,
    slug,
    priceMinor,
    sku,
    stockQuantity,
    mediaAssetIds,
    primaryMediaAssetId,
    shortDescription:
      typeof record.shortDescription === "string"
        ? normalizeOptionalText(record.shortDescription)
        : null
  };
}

function parseMediaAssetIdPayload(body: unknown): string {
  const record = requireRecord(body);

  if (typeof record.mediaAssetId !== "string" || record.mediaAssetId.trim() === "") {
    throw badRequest(
      API_ERROR_CODES.productMediaAssetInvalid,
      "Product media asset is invalid."
    );
  }

  return record.mediaAssetId.trim();
}

function parseOrderedIdsPayload(body: unknown): readonly string[] {
  const record = requireRecord(body);

  if (!Array.isArray(record.orderedIds)) {
    throw badRequest(
      API_ERROR_CODES.productMediaNotFound,
      "Product media order is invalid."
    );
  }

  return record.orderedIds.map((id) => {
    if (typeof id !== "string" || id.trim() === "") {
      throw badRequest(
        API_ERROR_CODES.productMediaNotFound,
        "Product media order is invalid."
      );
    }

    return id.trim();
  });
}

function parseUpdateProductPayload(body: unknown) {
  const record = requireRecord(body);
  const payload: {
    title?: string;
    slug?: string;
    shortDescription?: string | null;
    description?: string | null;
    primaryMediaAssetId?: string | null;
  } = {};

  if (record.title !== undefined) {
    payload.title = parseProductTitle(record.title);
  }

  if (record.slug !== undefined) {
    payload.slug = parseProductSlug(record.slug);
  }

  if (record.shortDescription !== undefined) {
    payload.shortDescription =
      typeof record.shortDescription === "string"
        ? normalizeOptionalText(record.shortDescription)
        : null;
  }

  if (record.description !== undefined) {
    payload.description =
      typeof record.description === "string"
        ? normalizeOptionalText(record.description)
        : null;
  }

  if (record.primaryMediaAssetId !== undefined) {
    payload.primaryMediaAssetId =
      typeof record.primaryMediaAssetId === "string" &&
      record.primaryMediaAssetId.trim() !== ""
        ? record.primaryMediaAssetId.trim()
        : null;
  }

  return payload;
}

function parseVariantPayload(body: unknown, partial: boolean) {
  const record = requireRecord(body);
  const payload: {
    title?: string;
    sku?: string;
    priceMinor?: number;
    compareAtPriceMinor?: number | null;
    stockQuantity?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
    isDefault?: boolean;
  } = {};

  if (!partial || record.title !== undefined) {
    payload.title = parseVariantTitle(record.title);
  }

  if (!partial || record.sku !== undefined) {
    payload.sku = parseSku(record.sku);
  }

  if (!partial || record.priceMinor !== undefined) {
    payload.priceMinor = parsePrice(record.priceMinor);
  }

  const priceMinor = payload.priceMinor ?? 0;

  if (record.compareAtPriceMinor !== undefined) {
    payload.compareAtPriceMinor =
      record.compareAtPriceMinor === null
        ? null
        : parseCompareAtPrice(priceMinor, record.compareAtPriceMinor);
  } else if (!partial) {
    payload.compareAtPriceMinor = null;
  }

  if (!partial || record.stockQuantity !== undefined) {
    payload.stockQuantity = parseStock(record.stockQuantity);
  }

  if (!partial || record.trackInventory !== undefined) {
    payload.trackInventory =
      record.trackInventory === undefined ? true : parseBoolean(record.trackInventory);
  }

  if (!partial || record.allowBackorder !== undefined) {
    payload.allowBackorder =
      record.allowBackorder === undefined
        ? false
        : parseBoolean(record.allowBackorder);
  }

  if (record.isDefault !== undefined) {
    payload.isDefault = parseBoolean(record.isDefault);
  }

  return payload as {
    readonly title: string;
    readonly sku: string;
    readonly priceMinor: number;
    readonly compareAtPriceMinor: number | null;
    readonly stockQuantity: number;
    readonly trackInventory: boolean;
    readonly allowBackorder: boolean;
    readonly isDefault?: boolean;
  };
}

function parseProductStatus(status: string | undefined): ProductStatus | undefined {
  return status === "DRAFT" || status === "ACTIVE" || status === "ARCHIVED"
    ? status
    : undefined;
}

function parseLimit(limit: string | undefined): number {
  if (limit === undefined) {
    return 50;
  }

  const parsed = Number.parseInt(limit, 10);

  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100 ? parsed : 50;
}

function parseProductTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw validationError("title", "Product title is required.");
  }

  const result = validateProductTitle(value);

  if (!result.ok) {
    throw validationError("title", "Product title is invalid.", result.code);
  }

  return result.value;
}

function parseProductSlug(value: unknown): string {
  if (typeof value !== "string") {
    throw badRequest(API_ERROR_CODES.productSlugInvalid, "Product slug is required.");
  }

  const result = validateProductSlug(value);

  if (!result.ok) {
    throw badRequest(API_ERROR_CODES.productSlugInvalid, "Product slug is invalid.", [
      {
        field: "slug",
        code: result.code,
        message: "Product slug is invalid."
      }
    ]);
  }

  return result.value;
}

function parseVariantTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw validationError("title", "Variant title is required.");
  }

  const result = validateVariantTitle(value);

  if (!result.ok) {
    throw validationError("title", "Variant title is invalid.", result.code);
  }

  return result.value;
}

function parseSku(value: unknown): string {
  if (typeof value !== "string") {
    throw badRequest(API_ERROR_CODES.variantSkuInvalid, "Variant SKU is required.");
  }

  const result = validateVariantSku(value);

  if (!result.ok) {
    throw badRequest(API_ERROR_CODES.variantSkuInvalid, "Variant SKU is invalid.", [
      {
        field: "sku",
        code: result.code,
        message: "Variant SKU is invalid."
      }
    ]);
  }

  return result.value;
}

function parsePrice(value: unknown): number {
  if (typeof value !== "number") {
    throw badRequest(API_ERROR_CODES.variantPriceInvalid, "Variant price is invalid.");
  }

  const result = validateMoneyMinor(value);

  if (!result.ok) {
    throw badRequest(API_ERROR_CODES.variantPriceInvalid, "Variant price is invalid.");
  }

  return result.value.amountMinor;
}

function parseCompareAtPrice(priceMinor: number, value: unknown): number {
  if (typeof value !== "number") {
    throw badRequest(
      API_ERROR_CODES.variantComparePriceInvalid,
      "Variant compare-at price is invalid."
    );
  }

  const result = validateCompareAtPriceMinor(priceMinor, value);

  if (!result.ok || result.value === null) {
    throw badRequest(
      API_ERROR_CODES.variantComparePriceInvalid,
      "Variant compare-at price is invalid."
    );
  }

  return result.value.amountMinor;
}

function parseStock(value: unknown): number {
  if (typeof value !== "number") {
    throw badRequest(API_ERROR_CODES.variantStockInvalid, "Variant stock is invalid.");
  }

  const result = validateStockQuantity(value);

  if (!result.ok) {
    throw badRequest(API_ERROR_CODES.variantStockInvalid, "Variant stock is invalid.");
  }

  return result.value;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw validationError("boolean", "Field must be a boolean.");
  }

  return value;
}

function parseMediaAssetIds(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    throw badRequest(
      API_ERROR_CODES.productMediaAssetInvalid,
      "Product media assets are invalid."
    );
  }

  return value.map((item) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw badRequest(
        API_ERROR_CODES.productMediaAssetInvalid,
        "Product media assets are invalid."
      );
    }

    return item.trim();
  });
}

function parseOptionalId(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();

  return normalized === "" ? null : normalized;
}

function requireRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw badRequest(API_ERROR_CODES.validationFailed, "Request body is invalid.");
  }

  return body as Record<string, unknown>;
}

function validationError(
  field: string,
  message: string,
  code: DomainErrorCode = DOMAIN_ERROR_CODES.productTitleRequired
) {
  return badRequest(API_ERROR_CODES.validationFailed, message, [
    {
      field,
      code,
      message
    }
  ]);
}

function validateActivation(
  product: Product,
  variants: readonly ProductVariant[]
): readonly ApiValidationIssue[] {
  const issues: ApiValidationIssue[] = [];

  if (variants.length === 0) {
    issues.push({
      field: "variants",
      code: "FIELD_REQUIRED",
      message: "Product must have at least one variant."
    });
  }

  if (!variants.some((variant) => variant.isDefault)) {
    issues.push({
      field: "variants.default",
      code: "FIELD_REQUIRED",
      message: "Product must have a default variant."
    });
  }

  for (const variant of variants) {
    if (variant.priceMinor < 0) {
      issues.push({
        field: `variants.${variant.id}.priceMinor`,
        code: "FIELD_INVALID_VALUE",
        message: "Variant price must be non-negative."
      });
    }
  }

  if (product.deletedAt !== null) {
    issues.push({
      field: "product",
      code: "FIELD_INVALID_VALUE",
      message: "Deleted product cannot be activated."
    });
  }

  return issues;
}

function getDefaultVariant(
  variants: readonly ProductVariant[]
): ProductVariant | null {
  return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
}

function toVariantResponse(variant: ProductVariant): ProductVariantResponse {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    price: toMoneyResponse(variant.priceMinor),
    compareAtPrice:
      variant.compareAtPriceMinor === null
        ? null
        : toMoneyResponse(variant.compareAtPriceMinor),
    stockQuantity: variant.stockQuantity,
    trackInventory: variant.trackInventory,
    allowBackorder: variant.allowBackorder,
    availability: toAvailability(variant),
    isDefault: variant.isDefault,
    position: variant.position
  };
}

function toAvailability(variant: ProductVariant): ProductAvailabilityResponse {
  return getProductAvailability({
    trackInventory: variant.trackInventory,
    stockQuantity: variant.stockQuantity,
    allowBackorder: variant.allowBackorder
  });
}

function toMoneyResponse(amountMinor: number): ProductMoneyResponse {
  const money = {
    amountMinor,
    currency: "RUB" as const
  };

  return {
    ...money,
    formatted: formatRubMoney(money)
  };
}

function toProductImage(config: AppConfig, mediaAsset: MediaAsset): ProductImageResponse {
  return {
    assetId: mediaAsset.id,
    url: createPublicMediaUrl(config, mediaAsset.id),
    altText: mediaAsset.altText,
    width: mediaAsset.width,
    height: mediaAsset.height
  };
}

function toProductGalleryImage(
  config: AppConfig,
  productMedia: ProductMediaWithAsset
): ProductGalleryImageResponse {
  return {
    id: productMedia.id,
    ...toProductImage(config, productMedia.mediaAsset),
    position: productMedia.position,
    isPrimary: productMedia.isPrimary
  };
}

function productNotFoundError() {
  return notFound(API_ERROR_CODES.productNotFound, "Product was not found.");
}

function variantNotFoundError() {
  return notFound(API_ERROR_CODES.variantNotFound, "Variant was not found.");
}

function mapProductError(error: unknown): Error {
  if (error instanceof ProductMediaRepositoryError) {
    switch (error.code) {
      case PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.notFound:
        return notFound(API_ERROR_CODES.productMediaNotFound, error.message);
      case PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.duplicate:
        return conflict(API_ERROR_CODES.productMediaDuplicate, error.message);
      case PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.limitReached:
        return badRequest(API_ERROR_CODES.productMediaLimitReached, error.message);
      case PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.assetInvalid:
        return badRequest(API_ERROR_CODES.productMediaAssetInvalid, error.message);
      case PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.crossProject:
        return badRequest(API_ERROR_CODES.productMediaCrossProject, error.message);
      case PRODUCT_MEDIA_REPOSITORY_ERROR_CODES.primaryInvalid:
        return badRequest(API_ERROR_CODES.productMediaPrimaryInvalid, error.message);
    }
  }

  if (isRecord(error) && error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

    if (target.includes("product_id") && target.includes("media_asset_id")) {
      return conflict(
        API_ERROR_CODES.productMediaDuplicate,
        "Media asset is already linked to this product."
      );
    }

    if (target.includes("sku")) {
      return conflict(API_ERROR_CODES.variantSkuConflict, "Variant SKU already exists.");
    }

    return conflict(
      API_ERROR_CODES.productSlugConflict,
      "Product slug already exists."
    );
  }

  return error instanceof Error ? error : new Error("Unknown product error.");
}

function isRecord(value: unknown): value is {
  readonly code?: unknown;
  readonly meta?: {
    readonly target?: unknown;
  };
} {
  return typeof value === "object" && value !== null;
}
