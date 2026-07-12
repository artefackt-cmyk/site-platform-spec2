import type { PageDocumentV2 } from "@site-platform/editor-core";
import type { ProductRenderModel } from "@site-platform/renderer";

export type PublicSitePageResponse = {
  readonly projectName: string;
  readonly pageTitle: string;
  readonly pageSlug: string;
  readonly snapshotVersion: number;
  readonly document: PageDocumentV2;
  readonly publishedAt: string;
  readonly canonicalPath: string;
  readonly navigation: readonly {
    readonly pageId: string;
    readonly title: string;
    readonly slug: string;
    readonly publicUrl: string;
  }[];
  readonly products: Readonly<Record<string, ProductRenderModel>>;
  readonly productList: readonly ProductRenderModel[];
  readonly siteSettings: {
    readonly headerEnabled: boolean;
    readonly footerEnabled: boolean;
    readonly header: {
      readonly brandText: string;
      readonly logoUrl: string;
      readonly navigation: readonly {
        readonly label: string;
        readonly type: "page" | "external";
        readonly pageId?: string;
        readonly url?: string;
      }[];
      readonly cartLinkEnabled: boolean;
      readonly ctaLabel: string;
      readonly ctaUrl: string;
    };
    readonly footer: {
      readonly brandText: string;
      readonly description: string;
      readonly email: string;
      readonly phone: string;
      readonly legalText: string;
      readonly copyrightText: string;
    };
    readonly revision: number;
  };
};

export type PublicProductVariantResponse = {
  readonly id: string;
  readonly title: string;
  readonly sku: string;
  readonly price: {
    readonly amountMinor: number;
    readonly currency: "RUB";
    readonly formatted: string;
  };
  readonly compareAtPrice: {
    readonly amountMinor: number;
    readonly currency: "RUB";
    readonly formatted: string;
  } | null;
  readonly stockQuantity: number;
  readonly trackInventory: boolean;
  readonly allowBackorder: boolean;
  readonly availability: "in-stock" | "out-of-stock" | "preorder";
  readonly isDefault: boolean;
  readonly position: number;
};

export type PublicCatalogProduct = ProductRenderModel & {
  readonly defaultVariant: PublicProductVariantResponse | null;
};

export type PublicCatalogListResponse = {
  readonly products: readonly PublicCatalogProduct[];
};

export type PublicProductDetailResponse = ProductRenderModel & {
  readonly images: readonly {
    readonly id: string;
    readonly url: string;
    readonly altText: string | null;
    readonly width: number | null;
    readonly height: number | null;
    readonly position: number;
    readonly isPrimary: boolean;
  }[];
  readonly description: string | null;
  readonly variants: readonly PublicProductVariantResponse[];
  readonly defaultVariant: PublicProductVariantResponse | null;
  readonly canonicalUrl: string;
};

export type PublicOrderResponse = {
  readonly orderNumber: number;
  readonly status: "NEW" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  readonly totalMinor: number;
  readonly subtotalMinor: number;
  readonly currency: "RUB";
  readonly customerName: string;
  readonly customerEmailMasked: string;
  readonly items: readonly {
    readonly productName: string;
    readonly variantName: string;
    readonly sku: string;
    readonly unitPriceMinor: number;
    readonly quantity: number;
    readonly lineTotalMinor: number;
    readonly currency: "RUB";
  }[];
  readonly createdAt: string;
  readonly successToken?: string;
};

export async function fetchPublicSitePage(input: {
  readonly apiUrl: string;
  readonly publicHandle: string;
  readonly pageSlug?: string;
}): Promise<
  | {
      readonly ok: true;
      readonly page: PublicSitePageResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly message: string;
    }
> {
  const apiUrl = input.apiUrl.replace(/\/$/, "");
  const path =
    input.pageSlug === undefined
      ? `/api/public/sites/${encodeURIComponent(input.publicHandle)}`
      : `/api/public/sites/${encodeURIComponent(
          input.publicHandle
        )}/pages/${encodeURIComponent(input.pageSlug)}`;

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message:
          response.status === 404
            ? "Страница не опубликована."
            : "Публичный сайт временно недоступен."
      };
    }

    return {
      ok: true,
      page: (await response.json()) as PublicSitePageResponse
    };
  } catch {
    return {
      ok: false,
      status: 503,
      message: "API временно недоступен."
    };
  }
}

export async function fetchPublicCatalog(input: {
  readonly apiUrl: string;
  readonly publicHandle: string;
}): Promise<
  | {
      readonly ok: true;
      readonly catalog: PublicCatalogListResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly message: string;
    }
> {
  const response = await requestPublicApi<PublicCatalogListResponse>({
    apiUrl: input.apiUrl,
    path: `/api/public/sites/${encodeURIComponent(input.publicHandle)}/products`,
    notFoundMessage: "Каталог не опубликован."
  });

  return response.ok
    ? {
        ok: true,
        catalog: response.payload
      }
    : response;
}

export async function fetchPublicProduct(input: {
  readonly apiUrl: string;
  readonly publicHandle: string;
  readonly productSlug: string;
}): Promise<
  | {
      readonly ok: true;
      readonly product: PublicProductDetailResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly message: string;
    }
> {
  const response = await requestPublicApi<PublicProductDetailResponse>({
    apiUrl: input.apiUrl,
    path: `/api/public/sites/${encodeURIComponent(
      input.publicHandle
    )}/products/${encodeURIComponent(input.productSlug)}`,
    notFoundMessage: "Товар не найден."
  });

  return response.ok
    ? {
        ok: true,
        product: response.payload
      }
    : response;
}

export async function createPublicOrder(input: {
  readonly apiUrl: string;
  readonly publicHandle: string;
  readonly idempotencyKey: string;
  readonly customer: {
    readonly name: string;
    readonly email: string;
    readonly phone?: string;
    readonly comment?: string;
  };
  readonly items: readonly {
    readonly productId: string;
    readonly variantId: string;
    readonly quantity: number;
  }[];
}): Promise<
  | {
      readonly ok: true;
      readonly order: PublicOrderResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly code?: string;
      readonly message: string;
    }
> {
  const response = await requestPublicApi<PublicOrderResponse>({
    apiUrl: input.apiUrl,
    path: `/api/public/sites/${encodeURIComponent(input.publicHandle)}/orders`,
    method: "POST",
    body: {
      idempotencyKey: input.idempotencyKey,
      customer: input.customer,
      items: input.items
    },
    notFoundMessage: "Витрина недоступна."
  });

  return response.ok
    ? {
        ok: true,
        order: response.payload
      }
    : response;
}

export async function fetchPublicOrder(input: {
  readonly apiUrl: string;
  readonly publicHandle: string;
  readonly publicToken: string;
}): Promise<
  | {
      readonly ok: true;
      readonly order: PublicOrderResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly message: string;
    }
> {
  const response = await requestPublicApi<PublicOrderResponse>({
    apiUrl: input.apiUrl,
    path: `/api/public/sites/${encodeURIComponent(
      input.publicHandle
    )}/orders/${encodeURIComponent(input.publicToken)}`,
    notFoundMessage: "Заказ не найден."
  });

  return response.ok
    ? {
        ok: true,
        order: response.payload
      }
    : response;
}

async function requestPublicApi<TResponse>(input: {
  readonly apiUrl: string;
  readonly path: string;
  readonly method?: "GET" | "POST";
  readonly body?: unknown;
  readonly notFoundMessage: string;
}): Promise<
  | {
      readonly ok: true;
      readonly payload: TResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly code?: string;
      readonly message: string;
    }
> {
  const apiUrl = input.apiUrl.replace(/\/$/, "");

  try {
    const response = await fetch(`${apiUrl}${input.path}`, {
      method: input.method ?? "GET",
      cache: "no-store",
      ...(input.body === undefined
        ? {}
        : {
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(input.body)
          })
    });

    if (!response.ok) {
      const errorPayload = await readErrorPayload(response);

      return {
        ok: false,
        status: response.status,
        ...(errorPayload.code === undefined ? {} : { code: errorPayload.code }),
        message: errorPayload.message ?? (
          response.status === 404
            ? input.notFoundMessage
            : "Публичный сайт временно недоступен."
        )
      };
    }

    return {
      ok: true,
      payload: (await response.json()) as TResponse
    };
  } catch {
    return {
      ok: false,
      status: 503,
      message: "API временно недоступен."
    };
  }
}

async function readErrorPayload(
  response: Response
): Promise<{ readonly code?: string; readonly message?: string }> {
  try {
    const payload = (await response.json()) as {
      readonly code?: string;
      readonly message?: string;
    };

    return {
      ...(typeof payload.code === "string" ? { code: payload.code } : {}),
      ...(typeof payload.message === "string" ? { message: payload.message } : {})
    };
  } catch {
    return {};
  }
}
