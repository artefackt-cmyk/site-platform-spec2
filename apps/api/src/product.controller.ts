import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import {
  ProductService,
  type ProductMediaListResponse,
  PublicCatalogService,
  type ProductDetailResponse,
  type ProductsListResponse,
  type PublicCatalogListResponse,
  type PublicProductDetailResponse
} from "./product.service";

@Controller("api/projects/:projectId/products")
export class ProductController {
  constructor(
    @Inject(ProductService)
    private readonly productService: ProductService
  ) {}

  @Get()
  async listProducts(
    @Param("projectId") projectId: string,
    @Query() query: Record<string, string | undefined>
  ): Promise<ProductsListResponse> {
    return this.productService.listProducts(projectId, query);
  }

  @Post()
  async createProduct(
    @Param("projectId") projectId: string,
    @Body() body: unknown
  ): Promise<ProductDetailResponse> {
    return this.productService.createProduct(projectId, body);
  }

  @Get(":productId")
  async getProduct(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string
  ): Promise<ProductDetailResponse> {
    return this.productService.getProduct(projectId, productId);
  }

  @Patch(":productId")
  async updateProduct(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Body() body: unknown
  ): Promise<ProductDetailResponse> {
    return this.productService.updateProduct(projectId, productId, body);
  }

  @Delete(":productId")
  async deleteProduct(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string
  ): Promise<{ readonly deleted: true }> {
    return this.productService.deleteProduct(projectId, productId);
  }

  @Post(":productId/activate")
  async activateProduct(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string
  ): Promise<ProductDetailResponse> {
    return this.productService.activateProduct(projectId, productId);
  }

  @Post(":productId/archive")
  async archiveProduct(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string
  ): Promise<ProductDetailResponse> {
    return this.productService.archiveProduct(projectId, productId);
  }

  @Post(":productId/variants")
  async createVariant(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Body() body: unknown
  ): Promise<ProductDetailResponse> {
    return this.productService.createVariant(projectId, productId, body);
  }

  @Patch(":productId/variants/:variantId")
  async updateVariant(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string,
    @Body() body: unknown
  ): Promise<ProductDetailResponse> {
    return this.productService.updateVariant(projectId, productId, variantId, body);
  }

  @Delete(":productId/variants/:variantId")
  async deleteVariant(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string
  ): Promise<ProductDetailResponse> {
    return this.productService.deleteVariant(projectId, productId, variantId);
  }

  @Post(":productId/variants/:variantId/set-default")
  async setDefaultVariant(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string
  ): Promise<ProductDetailResponse> {
    return this.productService.setDefaultVariant(projectId, productId, variantId);
  }

  @Get(":productId/media")
  async listProductMedia(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string
  ): Promise<ProductMediaListResponse> {
    return this.productService.listProductMedia(projectId, productId);
  }

  @Post(":productId/media")
  async addProductMedia(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Body() body: unknown
  ): Promise<ProductMediaListResponse> {
    return this.productService.addProductMedia(projectId, productId, body);
  }

  @Delete(":productId/media/:productMediaId")
  async removeProductMedia(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Param("productMediaId") productMediaId: string
  ): Promise<ProductMediaListResponse> {
    return this.productService.removeProductMedia(
      projectId,
      productId,
      productMediaId
    );
  }

  @Post(":productId/media/:productMediaId/set-primary")
  async setPrimaryProductMedia(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Param("productMediaId") productMediaId: string
  ): Promise<ProductMediaListResponse> {
    return this.productService.setPrimaryProductMedia(
      projectId,
      productId,
      productMediaId
    );
  }

  @Patch(":productId/media/reorder")
  async reorderProductMedia(
    @Param("projectId") projectId: string,
    @Param("productId") productId: string,
    @Body() body: unknown
  ): Promise<ProductMediaListResponse> {
    return this.productService.reorderProductMedia(projectId, productId, body);
  }
}

@Controller("api/public/sites/:publicHandle/products")
export class PublicProductController {
  constructor(
    @Inject(PublicCatalogService)
    private readonly publicCatalogService: PublicCatalogService
  ) {}

  @Get()
  async listProducts(
    @Param("publicHandle") publicHandle: string
  ): Promise<PublicCatalogListResponse> {
    return this.publicCatalogService.listProducts(publicHandle);
  }

  @Get(":productSlug")
  async getProduct(
    @Param("publicHandle") publicHandle: string,
    @Param("productSlug") productSlug: string
  ): Promise<PublicProductDetailResponse> {
    return this.publicCatalogService.getProduct(publicHandle, productSlug);
  }
}
