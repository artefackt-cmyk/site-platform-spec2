import type { PageDocumentV2 } from "@site-platform/editor-core";

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
