import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  DOMAIN_ERROR_CODES,
  MUTATION_PERMISSIONS,
  ORDER_ERROR_CODES,
  PERMISSIONS,
  canTransitionOrderStatus,
  hasPermission,
  normalizeEmail,
  packageName,
  validateOrganizationName,
  validatePublicHandle,
  validatePageSlug,
  validatePageTitle,
  validateProjectSlug,
  validateCompareAtPriceMinor,
  validateMoneyMinor,
  validateCreateOrderInput,
  validateProductSlug,
  validateProductTitle,
  validateStockQuantity,
  validateVariantSku
} from "./index";

describe("@site-platform/domain", () => {
  it("exposes the package entrypoint", () => {
    expect(packageName).toBe("@site-platform/domain");
  });

  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Owner@Example.COM  ")).toBe("owner@example.com");
  });

  it("validates organization names", () => {
    expect(validateOrganizationName("  Artefackt   Studio  ")).toEqual({
      ok: true,
      value: "Artefackt Studio"
    });
    expect(validateOrganizationName(" ")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.organizationNameRequired
    });
    expect(validateOrganizationName("A")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.organizationNameTooShort
    });
  });

  it("validates project slugs", () => {
    expect(validateProjectSlug("main-store")).toEqual({
      ok: true,
      value: "main-store"
    });
    expect(validateProjectSlug("Main Store")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.projectSlugInvalidFormat
    });
    expect(validateProjectSlug("a")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.projectSlugTooShort
    });
  });

  it("validates page titles and slugs", () => {
    expect(validatePageTitle("  Главная   страница  ")).toEqual({
      ok: true,
      value: "Главная страница"
    });
    expect(validatePageTitle(" ")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.pageTitleRequired
    });
    expect(validatePageSlug("about")).toEqual({
      ok: true,
      value: "about"
    });
    expect(validatePageSlug("About page")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.pageSlugInvalidFormat
    });
    expect(validatePageSlug("api")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.pageSlugReserved
    });
  });

  it("validates public handles", () => {
    expect(validatePublicHandle("Demo-Store")).toEqual({
      ok: true,
      value: "demo-store"
    });
    expect(validatePublicHandle("dashboard")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.publicHandleReserved
    });
    expect(validatePublicHandle("-store")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.publicHandleInvalidFormat
    });
  });

  it("validates product title, slug, SKU, price and stock", () => {
    expect(validateProductTitle("  Demo   Product  ")).toEqual({
      ok: true,
      value: "Demo Product"
    });
    expect(validateProductSlug("Demo-Product")).toEqual({
      ok: true,
      value: "demo-product"
    });
    expect(validateProductSlug("products")).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.productSlugReserved
    });
    expect(validateVariantSku(" sku_001 ")).toEqual({
      ok: true,
      value: "SKU_001"
    });
    expect(validateMoneyMinor(129900)).toEqual({
      ok: true,
      value: {
        amountMinor: 129900,
        currency: "RUB"
      }
    });
    expect(validateCompareAtPriceMinor(10000, 12000)).toEqual({
      ok: true,
      value: {
        amountMinor: 12000,
        currency: "RUB"
      }
    });
    expect(validateStockQuantity(-1)).toEqual({
      ok: false,
      code: DOMAIN_ERROR_CODES.stockQuantityInvalid
    });
  });

  it("validates checkout cart and customer payloads", () => {
    expect(
      validateCreateOrderInput({
        publicHandle: "demo-store",
        idempotencyKey: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2",
        customer: {
          name: "  Анна  Иванова ",
          email: " ANNA@EXAMPLE.COM "
        },
        items: [
          {
            productId: "product-1",
            variantId: "variant-1",
            quantity: 2
          }
        ]
      })
    ).toEqual({
      ok: true,
      value: {
        publicHandle: "demo-store",
        idempotencyKey: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2",
        customer: {
          name: "Анна Иванова",
          email: "anna@example.com"
        },
        items: [
          {
            productId: "product-1",
            variantId: "variant-1",
            quantity: 2
          }
        ]
      }
    });
    expect(
      validateCreateOrderInput({
        publicHandle: "demo-store",
        idempotencyKey: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2",
        customer: {
          name: "Анна",
          email: "anna@example.com"
        },
        items: []
      })
    ).toEqual({
      ok: false,
      code: ORDER_ERROR_CODES.cartEmpty
    });
    expect(
      validateCreateOrderInput({
        publicHandle: "demo-store",
        idempotencyKey: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2",
        customer: {
          name: "Анна",
          email: "anna@example.com"
        },
        items: [
          {
            productId: "product-1",
            variantId: "variant-1",
            quantity: 1
          },
          {
            productId: "product-1",
            variantId: "variant-1",
            quantity: 1
          }
        ]
      })
    ).toEqual({
      ok: false,
      code: ORDER_ERROR_CODES.cartItemInvalid
    });
  });

  it("validates order status transitions", () => {
    expect(canTransitionOrderStatus("NEW", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransitionOrderStatus("PROCESSING", "COMPLETED")).toBe(true);
    expect(canTransitionOrderStatus("PROCESSING", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("NEW", "PROCESSING")).toBe(false);
    expect(canTransitionOrderStatus("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "NEW")).toBe(false);
  });

  it("grants OWNER every current permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(hasPermission("OWNER", permission)).toBe(true);
    }
  });

  it("does not grant VIEWER mutation permissions", () => {
    for (const permission of MUTATION_PERMISSIONS) {
      expect(hasPermission("VIEWER", permission)).toBe(false);
    }

    expect(hasPermission("VIEWER", PERMISSIONS.organizationRead)).toBe(true);
    expect(hasPermission("VIEWER", PERMISSIONS.projectRead)).toBe(true);
    expect(hasPermission("VIEWER", PERMISSIONS.contentRead)).toBe(true);
  });
});
