import { describe, expect, it } from "vitest";
import {
  updateProductCreateFormDraft,
  type ProductCreateFormDraft
} from "./product-catalog-app";
import {
  updateProductVariantFormDraft,
  toMediaLibraryError,
  type ProductVariantFormDraft
} from "./product-editor-app";
import { DashboardNetworkError } from "./dashboard-api-client";

describe("product form state updates", () => {
  it("updates shortDescription from a primitive value without reading a React event later", () => {
    const current: ProductCreateFormDraft = {
      title: "",
      slug: "",
      priceRub: "",
      sku: "",
      stockQuantity: "0",
      shortDescription: ""
    };
    const value = "Описание товара";
    const next = {
      ...current,
      ...updateProductCreateFormDraft("shortDescription", value)
    };

    expect(next.shortDescription).toBe(value);
  });

  it("updates variant checkbox fields from primitive checked values", () => {
    const current: ProductVariantFormDraft = {
      title: "",
      sku: "",
      priceRub: "",
      compareAtPriceRub: "",
      stockQuantity: "0",
      trackInventory: true,
      allowBackorder: false
    };
    const next = {
      ...current,
      ...updateProductVariantFormDraft("trackInventory", false),
      ...updateProductVariantFormDraft("allowBackorder", true)
    };

    expect(next.trackInventory).toBe(false);
    expect(next.allowBackorder).toBe(true);
  });

  it("maps media library network failures to a Russian retryable message", () => {
    const message = toMediaLibraryError(
      new DashboardNetworkError("http://localhost:3002/api/projects/p/media")
    );

    expect(message).toContain("Не удалось загрузить изображения проекта");
    expect(message).not.toContain("Failed to fetch");
  });
});
