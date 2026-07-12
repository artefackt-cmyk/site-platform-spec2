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
    readonly title: string;
    readonly slug: string;
    readonly publicUrl: string;
  }[];
  readonly products: Readonly<Record<string, ProductRenderModel>>;
  readonly productList: readonly ProductRenderModel[];
};

export type PublicCatalogListResponse = {
  readonly products: readonly ProductRenderModel[];
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
  readonly variants: readonly {
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
  }[];
  readonly defaultVariant: PublicProductDetailResponse["variants"][number] | null;
  readonly canonicalUrl: string;
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

async function requestPublicApi<TResponse>(input: {
  readonly apiUrl: string;
  readonly path: string;
  readonly notFoundMessage: string;
}): Promise<
  | {
      readonly ok: true;
      readonly payload: TResponse;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly message: string;
    }
> {
  const apiUrl = input.apiUrl.replace(/\/$/, "");

  try {
    const response = await fetch(`${apiUrl}${input.path}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message:
          response.status === 404
            ? input.notFoundMessage
            : "Публичный сайт временно недоступен."
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
