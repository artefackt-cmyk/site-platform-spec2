import type { OrganizationRole } from "@site-platform/domain";
import type { PageDocumentV2 } from "@site-platform/editor-core";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type SitePageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type CurrentUserResponse = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly activeOrganization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly role: OrganizationRole;
};

export type ProjectSummary = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: ProjectStatus;
  readonly createdAt: string;
};

export type SitePageSummary = {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly slug: string;
  readonly status: SitePageStatus;
  readonly isHome: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProjectsListResponse = {
  readonly projects: readonly ProjectSummary[];
};

export type CreateProjectResponse = {
  readonly project: ProjectSummary;
};

export type ProjectPagesListResponse = {
  readonly pages: readonly SitePageSummary[];
};

export type CreateProjectPageResponse = {
  readonly page: SitePageSummary;
};

export type UpdateProjectPageResponse = {
  readonly page: SitePageSummary;
};

export type PageDocumentResponse = {
  readonly pageId: string;
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly document: PageDocumentV2;
};

export type MediaAssetSummary = {
  readonly id: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly url: string;
  readonly createdAt: string;
  readonly usageCount: number;
};

export type MediaAssetsListResponse = {
  readonly assets: readonly MediaAssetSummary[];
};

export type UploadMediaAssetResponse = {
  readonly asset: MediaAssetSummary;
};

export type UpdateMediaAssetResponse = {
  readonly asset: MediaAssetSummary;
};

export type DeleteMediaAssetResponse = {
  readonly deleted: true;
};

export type PublicationStatus =
  | "never-published"
  | "published-current"
  | "published-with-changes"
  | "unpublished";

export type PublicationStatusResponse = {
  readonly status: PublicationStatus;
  readonly publicUrl: string | null;
  readonly activeSnapshotId: string | null;
  readonly activeVersion: number | null;
  readonly publishedAt: string | null;
};

export type PublicationSettingsResponse = {
  readonly publicHandle: string;
  readonly basePublicUrl: string;
  readonly projectPublicUrl: string;
  readonly constraints: {
    readonly minLength: number;
    readonly maxLength: number;
    readonly pattern: string;
    readonly reserved: readonly string[];
  };
};

export type PublishPageResponse = {
  readonly snapshotId: string;
  readonly version: number;
  readonly publicationStatus: PublicationStatusResponse;
  readonly publicUrl: string;
  readonly publishedAt: string;
};

export type PublicationHistoryItem = {
  readonly snapshotId: string;
  readonly version: number;
  readonly pageTitle: string;
  readonly pageSlug: string;
  readonly sourceRevision: number;
  readonly publishedAt: string;
  readonly publishedBy: string | null;
  readonly active: boolean;
  readonly rollbackSourceSnapshotId: string | null;
};

export type PublicationHistoryResponse = {
  readonly publications: readonly PublicationHistoryItem[];
};

export type SavePageDocumentRequest = {
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly document: PageDocumentV2;
};

export type CreateProjectFormValues = {
  readonly name: string;
  readonly slug: string;
};

export type CreatePageFormValues = {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type UpdatePageSettingsFormValues = {
  readonly title: string;
  readonly slug: string;
  readonly isHome: boolean;
};

export type ApiErrorResponse = {
  readonly code: string;
  readonly message: string;
  readonly details?: readonly {
    readonly field: string;
    readonly code: string;
    readonly message: string;
  }[];
};
