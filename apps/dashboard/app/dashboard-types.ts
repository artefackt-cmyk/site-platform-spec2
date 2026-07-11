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

export type PageDocumentResponse = {
  readonly pageId: string;
  readonly schemaVersion: 2;
  readonly revision: number;
  readonly document: PageDocumentV2;
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

export type ApiErrorResponse = {
  readonly code: string;
  readonly message: string;
  readonly details?: readonly {
    readonly field: string;
    readonly code: string;
    readonly message: string;
  }[];
};
