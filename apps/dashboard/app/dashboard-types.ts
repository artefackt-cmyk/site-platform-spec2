import type { OrganizationRole } from "@site-platform/domain";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

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

export type ProjectsListResponse = {
  readonly projects: readonly ProjectSummary[];
};

export type CreateProjectResponse = {
  readonly project: ProjectSummary;
};

export type CreateProjectFormValues = {
  readonly name: string;
  readonly slug: string;
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
