import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { ProductController } from "./product.controller";
import {
  ProductService,
  type ProductMediaListResponse,
  type ProductsListResponse
} from "./product.service";

describe("ProductController", () => {
  it("receives ProductService through Nest DI for GET /api/projects/:projectId/products", async () => {
    const listResponse: ProductsListResponse = {
      products: []
    };
    const listProducts = vi.fn<ProductService["listProducts"]>(
      async () => listResponse
    );
    const productService: Pick<ProductService, "listProducts"> = {
      listProducts
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: productService
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(ProductController);

      await expect(controller.listProducts("project-1", {})).resolves.toBe(
        listResponse
      );
      expect(listProducts).toHaveBeenCalledWith("project-1", {});
    } finally {
      await moduleRef.close();
    }
  });

  it("delegates GET /api/projects/:projectId/products/:productId/media to ProductService", async () => {
    const mediaResponse: ProductMediaListResponse = {
      images: []
    };
    const listProductMedia = vi.fn<ProductService["listProductMedia"]>(
      async () => mediaResponse
    );
    const productService: Pick<ProductService, "listProductMedia"> = {
      listProductMedia
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: productService
        }
      ]
    }).compile();

    try {
      const controller = moduleRef.get(ProductController);

      await expect(
        controller.listProductMedia("project-1", "product-1")
      ).resolves.toBe(mediaResponse);
      expect(listProductMedia).toHaveBeenCalledWith("project-1", "product-1");
    } finally {
      await moduleRef.close();
    }
  });
});
