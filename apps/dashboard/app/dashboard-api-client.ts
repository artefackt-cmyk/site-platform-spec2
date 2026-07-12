import type {
  ApiErrorResponse,
  AuthSessionResponse,
  CreatePageFormValues,
  CreateProjectPageResponse,
  CreateProjectFormValues,
  CreateProjectResponse,
  CurrentUserResponse,
  DeleteMediaAssetResponse,
  MediaAssetsListResponse,
  OrderDetail,
  OrderStatus,
  OrdersListResponse,
  PublicationHistoryResponse,
  PublicationSettingsResponse,
  PublicationStatusResponse,
  ProductDetailResponse,
  ProductMediaListResponse,
  ProductStatus,
  ProjectSiteSettingsResponse,
  ProjectPagesListResponse,
  ProjectSummary,
  PageDocumentResponse,
  ProductsListResponse,
  PublishPageResponse,
  SavePageDocumentRequest,
  SitePageSummary,
  ProjectsListResponse,
  UpdatePageSettingsFormValues,
  UpdateMediaAssetResponse,
  UpdateProjectPageResponse,
  UploadMediaAssetResponse
} from "./dashboard-types";

export class DashboardApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorResponse["details"];

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message);
    this.name = "DashboardApiError";
    this.status = status;
    this.code = response.code;
    this.details = response.details;
  }
}

export class DashboardNetworkError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(
      "Не удалось связаться с API. Проверьте, что API запущен и адрес NEXT_PUBLIC_API_URL указан верно."
    );
    this.name = "DashboardNetworkError";
    this.url = url;
  }
}

export type DashboardApiClient = {
  readonly register: (input: {
    readonly email: string;
    readonly password: string;
    readonly displayName: string;
    readonly organizationName: string;
    readonly projectName?: string;
  }) => Promise<AuthSessionResponse>;
  readonly login: (input: {
    readonly email: string;
    readonly password: string;
  }) => Promise<AuthSessionResponse>;
  readonly logout: () => Promise<{ readonly ok: true }>;
  readonly getSession: () => Promise<AuthSessionResponse>;
  readonly requestPasswordReset: (input: {
    readonly email: string;
  }) => Promise<{ readonly ok: true; readonly developmentResetToken?: string }>;
  readonly confirmPasswordReset: (input: {
    readonly token: string;
    readonly newPassword: string;
  }) => Promise<AuthSessionResponse>;
  readonly completeOnboarding: (input: {
    readonly projectName?: string;
  }) => Promise<AuthSessionResponse>;
  readonly getCurrentUser: () => Promise<CurrentUserResponse>;
  readonly listProjects: () => Promise<ProjectsListResponse>;
  readonly createProject: (
    input: CreateProjectFormValues
  ) => Promise<CreateProjectResponse>;
  readonly getProject: (projectId: string) => Promise<ProjectSummary>;
  readonly listProjectPages: (
    projectId: string
  ) => Promise<ProjectPagesListResponse>;
  readonly createProjectPage: (
    projectId: string,
    input: CreatePageFormValues
  ) => Promise<CreateProjectPageResponse>;
  readonly getProjectPage: (
    projectId: string,
    pageId: string
  ) => Promise<SitePageSummary>;
  readonly updateProjectPage: (
    projectId: string,
    pageId: string,
    input: UpdatePageSettingsFormValues
  ) => Promise<UpdateProjectPageResponse>;
  readonly getProjectPageDocument: (
    projectId: string,
    pageId: string
  ) => Promise<PageDocumentResponse>;
  readonly saveProjectPageDocument: (
    projectId: string,
    pageId: string,
    input: SavePageDocumentRequest
  ) => Promise<PageDocumentResponse>;
  readonly getProjectSiteSettings: (
    projectId: string
  ) => Promise<ProjectSiteSettingsResponse>;
  readonly updateProjectSiteSettings: (
    projectId: string,
    input: ProjectSiteSettingsResponse
  ) => Promise<ProjectSiteSettingsResponse>;
  readonly listProjectMedia: (projectId: string) => Promise<MediaAssetsListResponse>;
  readonly uploadProjectMedia: (
    projectId: string,
    input: {
      readonly file: File;
      readonly altText?: string;
    }
  ) => Promise<UploadMediaAssetResponse>;
  readonly updateProjectMedia: (
    projectId: string,
    assetId: string,
    input: {
      readonly altText: string | null;
    }
  ) => Promise<UpdateMediaAssetResponse>;
  readonly deleteProjectMedia: (
    projectId: string,
    assetId: string
  ) => Promise<DeleteMediaAssetResponse>;
  readonly listProducts: (
    projectId: string,
    input?: {
      readonly status?: ProductStatus;
      readonly search?: string;
    }
  ) => Promise<ProductsListResponse>;
  readonly createProduct: (
    projectId: string,
    input: {
      readonly title: string;
      readonly slug: string;
      readonly priceMinor: number;
      readonly sku: string;
      readonly stockQuantity: number;
      readonly shortDescription?: string | null;
      readonly mediaAssetIds?: readonly string[];
      readonly primaryMediaAssetId?: string | null;
    }
  ) => Promise<ProductDetailResponse>;
  readonly getProduct: (
    projectId: string,
    productId: string
  ) => Promise<ProductDetailResponse>;
  readonly updateProduct: (
    projectId: string,
    productId: string,
    input: {
      readonly title?: string;
      readonly slug?: string;
      readonly shortDescription?: string | null;
      readonly description?: string | null;
      readonly primaryMediaAssetId?: string | null;
    }
  ) => Promise<ProductDetailResponse>;
  readonly deleteProduct: (
    projectId: string,
    productId: string
  ) => Promise<{ readonly deleted: true }>;
  readonly activateProduct: (
    projectId: string,
    productId: string
  ) => Promise<ProductDetailResponse>;
  readonly archiveProduct: (
    projectId: string,
    productId: string
  ) => Promise<ProductDetailResponse>;
  readonly createProductVariant: (
    projectId: string,
    productId: string,
    input: {
      readonly title: string;
      readonly sku: string;
      readonly priceMinor: number;
      readonly compareAtPriceMinor?: number | null;
      readonly stockQuantity: number;
      readonly trackInventory: boolean;
      readonly allowBackorder: boolean;
      readonly isDefault?: boolean;
    }
  ) => Promise<ProductDetailResponse>;
  readonly updateProductVariant: (
    projectId: string,
    productId: string,
    variantId: string,
    input: {
      readonly title?: string;
      readonly sku?: string;
      readonly priceMinor?: number;
      readonly compareAtPriceMinor?: number | null;
      readonly stockQuantity?: number;
      readonly trackInventory?: boolean;
      readonly allowBackorder?: boolean;
    }
  ) => Promise<ProductDetailResponse>;
  readonly deleteProductVariant: (
    projectId: string,
    productId: string,
    variantId: string
  ) => Promise<ProductDetailResponse>;
  readonly setDefaultProductVariant: (
    projectId: string,
    productId: string,
    variantId: string
  ) => Promise<ProductDetailResponse>;
  readonly listProductMedia: (
    projectId: string,
    productId: string
  ) => Promise<ProductMediaListResponse>;
  readonly addProductMedia: (
    projectId: string,
    productId: string,
    input: {
      readonly mediaAssetId: string;
    }
  ) => Promise<ProductMediaListResponse>;
  readonly removeProductMedia: (
    projectId: string,
    productId: string,
    productMediaId: string
  ) => Promise<ProductMediaListResponse>;
  readonly setPrimaryProductMedia: (
    projectId: string,
    productId: string,
    productMediaId: string
  ) => Promise<ProductMediaListResponse>;
  readonly reorderProductMedia: (
    projectId: string,
    productId: string,
    input: {
      readonly orderedIds: readonly string[];
    }
  ) => Promise<ProductMediaListResponse>;
  readonly listOrders: (
    projectId: string,
    input?: {
      readonly status?: OrderStatus;
      readonly search?: string;
    }
  ) => Promise<OrdersListResponse>;
  readonly getOrder: (
    projectId: string,
    orderId: string
  ) => Promise<OrderDetail>;
  readonly updateOrderStatus: (
    projectId: string,
    orderId: string,
    status: OrderStatus
  ) => Promise<OrderDetail>;
  readonly getPublicationSettings: (
    projectId: string
  ) => Promise<PublicationSettingsResponse>;
  readonly updatePublicationSettings: (
    projectId: string,
    input: {
      readonly publicHandle: string;
    }
  ) => Promise<PublicationSettingsResponse>;
  readonly getPagePublicationStatus: (
    projectId: string,
    pageId: string
  ) => Promise<PublicationStatusResponse>;
  readonly publishPage: (
    projectId: string,
    pageId: string,
    input: {
      readonly expectedRevision: number;
    }
  ) => Promise<PublishPageResponse>;
  readonly unpublishPage: (
    projectId: string,
    pageId: string
  ) => Promise<{
    readonly publicationStatus: PublicationStatusResponse;
  }>;
  readonly listPagePublications: (
    projectId: string,
    pageId: string
  ) => Promise<PublicationHistoryResponse>;
  readonly rollbackPagePublication: (
    projectId: string,
    pageId: string,
    snapshotId: string
  ) => Promise<PublishPageResponse>;
};

export function createDashboardApiClient(apiUrl: string): DashboardApiClient {
  const normalizedApiUrl = apiUrl.replace(/\/$/, "");

  return {
    register: (input) =>
      request<AuthSessionResponse>(normalizedApiUrl, "/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }),
    login: (input) =>
      request<AuthSessionResponse>(normalizedApiUrl, "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }),
    logout: () =>
      request<{ readonly ok: true }>(normalizedApiUrl, "/api/auth/logout", {
        method: "POST"
      }),
    getSession: () =>
      request<AuthSessionResponse>(normalizedApiUrl, "/api/auth/session"),
    requestPasswordReset: (input) =>
      request<{ readonly ok: true; readonly developmentResetToken?: string }>(
        normalizedApiUrl,
        "/api/auth/password-reset/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    confirmPasswordReset: (input) =>
      request<AuthSessionResponse>(
        normalizedApiUrl,
        "/api/auth/password-reset/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    completeOnboarding: (input) =>
      request<AuthSessionResponse>(
        normalizedApiUrl,
        "/api/auth/onboarding/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    getCurrentUser: () => request<CurrentUserResponse>(normalizedApiUrl, "/api/me"),
    listProjects: () =>
      request<ProjectsListResponse>(normalizedApiUrl, "/api/projects"),
    createProject: (input) =>
      request<CreateProjectResponse>(normalizedApiUrl, "/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      }),
    getProject: (projectId) =>
      request<ProjectSummary>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}`
      ),
    listProjectPages: (projectId) =>
      request<ProjectPagesListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages`
      ),
    createProjectPage: (projectId, input) =>
      request<CreateProjectPageResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    getProjectPage: (projectId, pageId) =>
      request<SitePageSummary>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}`
      ),
    updateProjectPage: (projectId, pageId, input) =>
      request<UpdateProjectPageResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    getProjectPageDocument: (projectId, pageId) =>
      request<PageDocumentResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/document`
      ),
    saveProjectPageDocument: (projectId, pageId, input) =>
      request<PageDocumentResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/document`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    getProjectSiteSettings: (projectId) =>
      request<ProjectSiteSettingsResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/site-settings`
      ),
    updateProjectSiteSettings: (projectId, input) =>
      request<ProjectSiteSettingsResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/site-settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    listProjectMedia: (projectId) =>
      request<MediaAssetsListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/media`
      ),
    uploadProjectMedia: (projectId, input) => {
      const formData = new FormData();

      formData.append("file", input.file);

      if (input.altText !== undefined) {
        formData.append("altText", input.altText);
      }

      return request<UploadMediaAssetResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/media`,
        {
          method: "POST",
          body: formData
        }
      );
    },
    updateProjectMedia: (projectId, assetId, input) =>
      request<UpdateMediaAssetResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(
          assetId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    deleteProjectMedia: (projectId, assetId) =>
      request<DeleteMediaAssetResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(
          assetId
        )}`,
        {
          method: "DELETE"
        }
      ),
    listProducts: (projectId, input) => {
      const query = new URLSearchParams();

      if (input?.status !== undefined) {
        query.set("status", input.status);
      }

      if (input?.search !== undefined && input.search.trim() !== "") {
        query.set("search", input.search.trim());
      }

      const suffix = query.size === 0 ? "" : `?${query.toString()}`;

      return request<ProductsListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products${suffix}`
      );
    },
    createProduct: (projectId, input) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    getProduct: (projectId, productId) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}`
      ),
    updateProduct: (projectId, productId, input) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    deleteProduct: (projectId, productId) =>
      request<{ readonly deleted: true }>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}`,
        {
          method: "DELETE"
        }
      ),
    activateProduct: (projectId, productId) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/activate`,
        {
          method: "POST"
        }
      ),
    archiveProduct: (projectId, productId) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/archive`,
        {
          method: "POST"
        }
      ),
    createProductVariant: (projectId, productId, input) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/variants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    updateProductVariant: (projectId, productId, variantId, input) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/variants/${encodeURIComponent(variantId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    deleteProductVariant: (projectId, productId, variantId) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/variants/${encodeURIComponent(variantId)}`,
        {
          method: "DELETE"
        }
      ),
    setDefaultProductVariant: (projectId, productId, variantId) =>
      request<ProductDetailResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/variants/${encodeURIComponent(variantId)}/set-default`,
        {
          method: "POST"
        }
      ),
    listProductMedia: (projectId, productId) =>
      request<ProductMediaListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/media`
      ),
    addProductMedia: (projectId, productId, input) =>
      request<ProductMediaListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/media`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    removeProductMedia: (projectId, productId, productMediaId) =>
      request<ProductMediaListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/media/${encodeURIComponent(productMediaId)}`,
        {
          method: "DELETE"
        }
      ),
    setPrimaryProductMedia: (projectId, productId, productMediaId) =>
      request<ProductMediaListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/media/${encodeURIComponent(productMediaId)}/set-primary`,
        {
          method: "POST"
        }
      ),
    reorderProductMedia: (projectId, productId, input) =>
      request<ProductMediaListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/products/${encodeURIComponent(
          productId
        )}/media/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    listOrders: (projectId, input) => {
      const query = new URLSearchParams();

      if (input?.status !== undefined) {
        query.set("status", input.status);
      }

      if (input?.search !== undefined && input.search.trim() !== "") {
        query.set("search", input.search.trim());
      }

      const suffix = query.size === 0 ? "" : `?${query.toString()}`;

      return request<OrdersListResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/orders${suffix}`
      );
    },
    getOrder: (projectId, orderId) =>
      request<OrderDetail>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/orders/${encodeURIComponent(
          orderId
        )}`
      ),
    updateOrderStatus: (projectId, orderId, status) =>
      request<OrderDetail>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/orders/${encodeURIComponent(
          orderId
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      ),
    getPublicationSettings: (projectId) =>
      request<PublicationSettingsResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/publication-settings`
      ),
    updatePublicationSettings: (projectId, input) =>
      request<PublicationSettingsResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/publication-settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    getPagePublicationStatus: (projectId, pageId) =>
      request<PublicationStatusResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/publication-status`
      ),
    publishPage: (projectId, pageId, input) =>
      request<PublishPageResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(input)
        }
      ),
    unpublishPage: (projectId, pageId) =>
      request<{
        readonly publicationStatus: PublicationStatusResponse;
      }>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/unpublish`,
        {
          method: "POST"
        }
      ),
    listPagePublications: (projectId, pageId) =>
      request<PublicationHistoryResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/publications`
      ),
    rollbackPagePublication: (projectId, pageId, snapshotId) =>
      request<PublishPageResponse>(
        normalizedApiUrl,
        `/api/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
          pageId
        )}/publications/${encodeURIComponent(snapshotId)}/rollback`,
        {
          method: "POST"
        }
      )
  };
}

async function request<TResponse>(
  apiUrl: string,
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const url = `${apiUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      credentials: "include"
    });
  } catch {
    throw new DashboardNetworkError(url);
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new DashboardApiError(response.status, toApiErrorResponse(payload));
  }

  return payload as TResponse;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toApiErrorResponse(payload: unknown): ApiErrorResponse {
  if (!isRecord(payload)) {
    return {
      code: "UNKNOWN_ERROR",
      message: "Не удалось выполнить запрос."
    };
  }

  const code = typeof payload.code === "string" ? payload.code : "UNKNOWN_ERROR";
  const message =
    typeof payload.message === "string"
      ? payload.message
      : "Не удалось выполнить запрос.";

  return {
    code,
    message,
    ...(Array.isArray(payload.details)
      ? { details: payload.details.filter(isApiErrorDetail) }
      : {})
  };
}

function isApiErrorDetail(value: unknown): value is {
  readonly field: string;
  readonly code: string;
  readonly message: string;
} {
  return (
    isRecord(value) &&
    typeof value.field === "string" &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
