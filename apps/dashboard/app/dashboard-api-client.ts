import type {
  ApiErrorResponse,
  CreatePageFormValues,
  CreateProjectPageResponse,
  CreateProjectFormValues,
  CreateProjectResponse,
  CurrentUserResponse,
  DeleteMediaAssetResponse,
  MediaAssetsListResponse,
  ProjectPagesListResponse,
  ProjectSummary,
  PageDocumentResponse,
  SavePageDocumentRequest,
  SitePageSummary,
  ProjectsListResponse,
  UpdateMediaAssetResponse,
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

export type DashboardApiClient = {
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
  readonly getProjectPageDocument: (
    projectId: string,
    pageId: string
  ) => Promise<PageDocumentResponse>;
  readonly saveProjectPageDocument: (
    projectId: string,
    pageId: string,
    input: SavePageDocumentRequest
  ) => Promise<PageDocumentResponse>;
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
};

export function createDashboardApiClient(apiUrl: string): DashboardApiClient {
  const normalizedApiUrl = apiUrl.replace(/\/$/, "");

  return {
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
      )
  };
}

async function request<TResponse>(
  apiUrl: string,
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${apiUrl}${path}`, init);
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
