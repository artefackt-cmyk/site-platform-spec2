import * as React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogCartAction, ProductAddToCart } from "./cart-client";

describe("storefront cart and checkout UI", () => {
  it("renders add-to-cart CTA for a default available variant", () => {
    const html = renderToStaticMarkup(
      React.createElement(CatalogCartAction, {
        publicHandle: "demo-store",
        productId: "product-1",
        productTitle: "Демо футболка",
        productSlug: "demo-tshirt",
        defaultVariant: {
          id: "variant-1",
          title: "Основной вариант",
          sku: "TSHIRT",
          price: {
            amountMinor: 10000,
            currency: "RUB",
            formatted: "100,00 ₽"
          },
          compareAtPrice: null,
          stockQuantity: 3,
          trackInventory: true,
          allowBackorder: false,
          availability: "in-stock",
          isDefault: true,
          position: 0
        }
      })
    );

    expect(html).toContain("В корзину");
    expect(html).toContain("Подробнее");
  });

  it("renders variant selection and quantity on product detail", () => {
    const html = renderToStaticMarkup(
      React.createElement(ProductAddToCart, {
        publicHandle: "demo-store",
        productId: "product-1",
        productTitle: "Демо футболка",
        defaultVariantId: "variant-1",
        variants: [
          {
            id: "variant-1",
            title: "M",
            sku: "TSHIRT-M",
            price: {
              amountMinor: 10000,
              currency: "RUB",
              formatted: "100,00 ₽"
            },
            compareAtPrice: null,
            stockQuantity: 3,
            trackInventory: true,
            allowBackorder: false,
            availability: "in-stock",
            isDefault: true,
            position: 0
          }
        ]
      })
    );

    expect(html).toContain("Вариант");
    expect(html).toContain("Количество");
    expect(html).toContain("В наличии: 3");
  });

  it("ships checkout and mobile cart layout classes", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain(".storefront-checkout-layout");
    expect(css).toContain(".storefront-cart-link");
    expect(css).toContain(".storefront-error");
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toContain("grid-template-columns: 1fr;");
  });
});
