import "reflect-metadata";
import { HttpException } from "@nestjs/common";
import {
  PageDocumentRevisionConflictError,
  type PageDocumentRecord,
  type Project,
  type SitePage
} from "@site-platform/database";
import {
  createDefaultBlock,
  createEmptyPageDocument,
  insertBlock,
  validatePageDocument
} from "@site-platform/editor-core";
import type { OrganizationRole, TenantContext } from "@site-platform/domain";
import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "./api-errors";
import type { ActiveIdentity, CurrentIdentityResolver } from "./current-identity";
import type {
  CreateDraftProjectInput,
  CreateProjectPageInput,
  ProjectStore
} from "./project-store";
import { ProjectsService } from "./projects.service";

const tenantContext: TenantContext = {
  organizationId: "org-a",
  userId: "user-a",
  membershipId: "membership-a",
  role: "OWNER"
};

describe("GET /api/projects", () => {
  it("returns only projects from the active organization", async () => {
    const { service } = createProjectsService({
      projects: [
        createProject({ id: "project-a", organizationId: "org-a" }),
        createProject({ id: "project-b", organizationId: "org-b" })
      ]
    });

    await expect(service.listProjects()).resolves.toEqual({
      projects: [
        expect.objectContaining({
          id: "project-a"
        })
      ]
    });
  });

  it("does not return soft-deleted projects", async () => {
    const { service } = createProjectsService({
      projects: [
        createProject({
          id: "project-deleted",
          organizationId: "org-a",
          deletedAt: new Date("2026-01-01T00:00:00.000Z")
        })
      ]
    });

    await expect(service.listProjects()).resolves.toEqual({
      projects: []
    });
  });
});

describe("GET /api/projects/:projectId", () => {
  it("returns project details inside the active organization", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a", organizationId: "org-a" })]
    });

    await expect(service.getProject("project-a")).resolves.toMatchObject({
      id: "project-a",
      name: "Demo Store",
      slug: "demo-store",
      status: "DRAFT"
    });
  });

  it("returns not found for a project outside the active organization", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-b", organizationId: "org-b" })]
    });

    await expectHttpError(
      service.getProject("project-b"),
      404,
      API_ERROR_CODES.projectNotFound
    );
  });
});

describe("POST /api/projects", () => {
  it("creates a draft project and audit log through the project store", async () => {
    const { service, projectStore } = createProjectsService();

    await expect(
      service.createProject({
        name: "New Site",
        slug: "new-site"
      })
    ).resolves.toEqual({
      project: expect.objectContaining({
        name: "New Site",
        slug: "new-site",
        status: "DRAFT"
      })
    });
    expect(projectStore.createdProjectCount).toBe(1);
  });

  it("returns a stable duplicate slug error", async () => {
    const { service } = createProjectsService({
      projects: [
        createProject({
          organizationId: "org-a",
          slug: "duplicate"
        })
      ]
    });

    await expectHttpError(
      service.createProject({
        name: "Duplicate",
        slug: "duplicate"
      }),
      409,
      API_ERROR_CODES.projectSlugAlreadyExists
    );
  });

  it("returns forbidden when the current role cannot create projects", async () => {
    const { service } = createProjectsService({
      role: "VIEWER"
    });

    await expectHttpError(
      service.createProject({
        name: "Viewer Project",
        slug: "viewer-project"
      }),
      403,
      API_ERROR_CODES.permissionDenied
    );
  });

  it("rejects organizationId in the payload", async () => {
    const { service } = createProjectsService();

    await expectHttpError(
      service.createProject({
        name: "Wrong Tenant",
        slug: "wrong-tenant",
        organizationId: "org-b"
      }),
      400,
      API_ERROR_CODES.organizationIdNotAllowed
    );
  });
});

describe("GET /api/projects/:projectId/pages", () => {
  it("returns only pages from the requested project", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" }), createProject({ id: "project-b" })],
      pages: [
        createPage({ id: "page-a", projectId: "project-a" }),
        createPage({ id: "page-b", projectId: "project-b", slug: "other" })
      ]
    });

    await expect(service.listProjectPages("project-a")).resolves.toEqual({
      pages: [
        expect.objectContaining({
          id: "page-a"
        })
      ]
    });
  });

  it("returns not found for a foreign project", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-b", organizationId: "org-b" })]
    });

    await expectHttpError(
      service.listProjectPages("project-b"),
      404,
      API_ERROR_CODES.projectNotFound
    );
  });

  it("does not return soft-deleted pages", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [
        createPage({
          id: "page-deleted",
          projectId: "project-a",
          deletedAt: new Date("2026-01-01T00:00:00.000Z")
        })
      ]
    });

    await expect(service.listProjectPages("project-a")).resolves.toEqual({
      pages: []
    });
  });
});

describe("POST /api/projects/:projectId/pages", () => {
  it("creates a page", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })]
    });

    await expect(
      service.createProjectPage("project-a", {
        title: "Landing",
        slug: "landing",
        isHome: true
      })
    ).resolves.toEqual({
      page: expect.objectContaining({
        title: "Landing",
        slug: "landing",
        isHome: true,
        status: "DRAFT"
      })
    });
  });

  it("returns a stable duplicate slug error", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ projectId: "project-a", slug: "duplicate" })]
    });

    await expectHttpError(
      service.createProjectPage("project-a", {
        title: "Duplicate",
        slug: "duplicate"
      }),
      409,
      API_ERROR_CODES.pageSlugAlreadyExists
    );
  });

  it("rejects organizationId in the payload", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })]
    });

    await expectHttpError(
      service.createProjectPage("project-a", {
        title: "Wrong Tenant",
        slug: "wrong-tenant",
        organizationId: "org-b"
      }),
      400,
      API_ERROR_CODES.organizationIdNotAllowed
    );
  });
});

describe("GET /api/projects/:projectId/pages/:pageId", () => {
  it("returns page details", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ id: "page-a", projectId: "project-a" })]
    });

    await expect(
      service.getProjectPage("project-a", "page-a")
    ).resolves.toMatchObject({
      id: "page-a",
      title: "Главная",
      slug: "home"
    });
  });
});

describe("GET /api/projects/:projectId/pages/:pageId/document", () => {
  it("returns an existing or default page document", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ id: "page-a", projectId: "project-a" })]
    });

    await expect(
      service.getProjectPageDocument("project-a", "page-a")
    ).resolves.toMatchObject({
      pageId: "page-a",
      schemaVersion: 1,
      revision: 1,
      document: {
        root: {
          children: []
        }
      }
    });
  });
});

describe("PUT /api/projects/:projectId/pages/:pageId/document", () => {
  it("saves a valid page document", async () => {
    const document = insertBlock(
      createEmptyPageDocument(),
      createDefaultBlock("heading")
    );
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ id: "page-a", projectId: "project-a" })],
      documents: [createPageDocument({ pageId: "page-a", revision: 1 })]
    });

    await expect(
      service.saveProjectPageDocument("project-a", "page-a", {
        schemaVersion: 1,
        revision: 1,
        document
      })
    ).resolves.toMatchObject({
      pageId: "page-a",
      revision: 2,
      document: {
        root: {
          children: [expect.objectContaining({ type: "heading" })]
        }
      }
    });
  });

  it("rejects invalid documents", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ id: "page-a", projectId: "project-a" })],
      documents: [createPageDocument({ pageId: "page-a", revision: 1 })]
    });

    await expectHttpError(
      service.saveProjectPageDocument("project-a", "page-a", {
        schemaVersion: 1,
        revision: 1,
        document: {
          ...createEmptyPageDocument(),
          schemaVersion: 2
        }
      }),
      400,
      API_ERROR_CODES.pageDocumentInvalid
    );
  });

  it("returns a stable conflict error for stale revisions", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ id: "page-a", projectId: "project-a" })],
      documents: [createPageDocument({ pageId: "page-a", revision: 2 })]
    });

    await expectHttpError(
      service.saveProjectPageDocument("project-a", "page-a", {
        schemaVersion: 1,
        revision: 1,
        document: createEmptyPageDocument()
      }),
      409,
      API_ERROR_CODES.pageDocumentRevisionConflict
    );
  });

  it("returns forbidden when the current role cannot update pages", async () => {
    const { service } = createProjectsService({
      role: "VIEWER",
      projects: [createProject({ id: "project-a" })],
      pages: [createPage({ id: "page-a", projectId: "project-a" })],
      documents: [createPageDocument({ pageId: "page-a", revision: 1 })]
    });

    await expectHttpError(
      service.saveProjectPageDocument("project-a", "page-a", {
        schemaVersion: 1,
        revision: 1,
        document: createEmptyPageDocument()
      }),
      403,
      API_ERROR_CODES.permissionDenied
    );
  });

  it("returns not found for a cross-tenant page", async () => {
    const { service } = createProjectsService({
      projects: [createProject({ id: "project-b", organizationId: "org-b" })],
      pages: [
        createPage({
          id: "page-b",
          organizationId: "org-b",
          projectId: "project-b"
        })
      ]
    });

    await expectHttpError(
      service.getProjectPageDocument("project-b", "page-b"),
      404,
      API_ERROR_CODES.projectNotFound
    );
  });
});

type CreateProjectsServiceOptions = {
  readonly role?: OrganizationRole;
  readonly projects?: readonly Project[];
  readonly pages?: readonly SitePage[];
  readonly documents?: readonly PageDocumentRecord[];
};

function createProjectsService(options: CreateProjectsServiceOptions = {}): {
  readonly service: ProjectsService;
  readonly projectStore: InMemoryProjectStore;
} {
  const role = options.role ?? "OWNER";
  const currentIdentityResolver: CurrentIdentityResolver = {
    getCurrentIdentity: async () => createIdentity(role)
  };
  const projectStore = new InMemoryProjectStore(
    options.projects ?? [],
    options.pages ?? [],
    options.documents ?? []
  );

  return {
    service: new ProjectsService(currentIdentityResolver, projectStore),
    projectStore
  };
}

function createIdentity(role: OrganizationRole): ActiveIdentity {
  return {
    user: {
      id: tenantContext.userId,
      email: "owner@example.com",
      displayName: "Demo Owner"
    },
    organization: {
      id: tenantContext.organizationId,
      name: "Demo Brand",
      slug: "demo-brand"
    },
    membershipId: tenantContext.membershipId,
    role,
    tenantContext: {
      ...tenantContext,
      role
    }
  };
}

class InMemoryProjectStore implements ProjectStore {
  private readonly projects: Project[];
  private readonly pages: SitePage[];
  private readonly documents: PageDocumentRecord[];
  private createdProjects = 0;
  private createdPages = 0;

  constructor(
    projects: readonly Project[],
    pages: readonly SitePage[],
    documents: readonly PageDocumentRecord[]
  ) {
    this.projects = [...projects];
    this.pages = [...pages];
    this.documents = [...documents];
  }

  get createdProjectCount(): number {
    return this.createdProjects;
  }

  async listByTenant(
    activeTenantContext: TenantContext
  ): Promise<readonly Project[]> {
    return this.projects.filter(
      (project) =>
        project.organizationId === activeTenantContext.organizationId &&
        project.deletedAt === null
    );
  }

  async findByTenantAndId(
    activeTenantContext: TenantContext,
    projectId: string
  ): Promise<Project | null> {
    return (
      this.projects.find(
        (project) =>
          project.id === projectId &&
          project.organizationId === activeTenantContext.organizationId &&
          project.deletedAt === null
      ) ?? null
    );
  }

  async findByTenantAndSlug(
    activeTenantContext: TenantContext,
    slug: string
  ): Promise<Project | null> {
    return (
      this.projects.find(
        (project) =>
          project.organizationId === activeTenantContext.organizationId &&
          project.slug === slug &&
          project.deletedAt === null
      ) ?? null
    );
  }

  async createDraftWithAudit(input: CreateDraftProjectInput): Promise<Project> {
    const project = createProject({
      id: `created-${this.createdProjects + 1}`,
      organizationId: input.tenantContext.organizationId,
      name: input.name,
      slug: input.slug
    });

    this.createdProjects += 1;
    this.projects.push(project);

    return project;
  }

  async listPagesByProject(
    activeTenantContext: TenantContext,
    projectId: string
  ): Promise<readonly SitePage[]> {
    const project = await this.findByTenantAndId(activeTenantContext, projectId);

    if (project === null) {
      return [];
    }

    return this.pages.filter(
      (page) =>
        page.organizationId === activeTenantContext.organizationId &&
        page.projectId === projectId &&
        page.deletedAt === null
    );
  }

  async findPageById(
    activeTenantContext: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<SitePage | null> {
    const pages = await this.listPagesByProject(activeTenantContext, projectId);

    return pages.find((page) => page.id === pageId) ?? null;
  }

  async createPageWithAudit(
    input: CreateProjectPageInput
  ): Promise<SitePage | null> {
    const project = await this.findByTenantAndId(
      input.tenantContext,
      input.projectId
    );

    if (project === null) {
      return null;
    }

    const existingPage = this.pages.find(
      (page) => page.projectId === input.projectId && page.slug === input.slug
    );

    if (existingPage !== undefined) {
      throw Object.assign(new Error("Unique constraint failed"), {
        code: "P2002" as const
      });
    }

    if (input.isHome) {
      for (const page of this.pages) {
        if (
          page.organizationId === input.tenantContext.organizationId &&
          page.projectId === input.projectId
        ) {
          page.isHome = false;
        }
      }
    }

    const page = createPage({
      id: `created-page-${this.createdPages + 1}`,
      organizationId: input.tenantContext.organizationId,
      projectId: input.projectId,
      title: input.title,
      slug: input.slug,
      isHome: input.isHome
    });

    this.createdPages += 1;
    this.pages.push(page);

    return page;
  }

  async getOrCreatePageDocument(
    activeTenantContext: TenantContext,
    projectId: string,
    pageId: string
  ): Promise<PageDocumentRecord | null> {
    const page = await this.findPageById(activeTenantContext, projectId, pageId);

    if (page === null) {
      return null;
    }

    const existingDocument = this.documents.find(
      (document) =>
        document.organizationId === activeTenantContext.organizationId &&
        document.projectId === projectId &&
        document.pageId === pageId
    );

    if (existingDocument !== undefined) {
      return existingDocument;
    }

    const document = createPageDocument({
      organizationId: activeTenantContext.organizationId,
      projectId,
      pageId
    });

    this.documents.push(document);

    return document;
  }

  async savePageDocumentWithAudit(input: {
    readonly tenantContext: TenantContext;
    readonly projectId: string;
    readonly pageId: string;
    readonly document: unknown;
    readonly expectedRevision: number;
  }): Promise<PageDocumentRecord | null> {
    const page = await this.findPageById(
      input.tenantContext,
      input.projectId,
      input.pageId
    );

    if (page === null) {
      return null;
    }

    const document = await this.getOrCreatePageDocument(
      input.tenantContext,
      input.projectId,
      input.pageId
    );

    if (document === null) {
      return null;
    }

    if (document.revision !== input.expectedRevision) {
      throw new PageDocumentRevisionConflictError();
    }

    const validation = validatePageDocument(input.document);

    if (!validation.ok) {
      throw new Error("Expected valid document in service-level test store.");
    }

    const nextDocument = {
      ...document,
      schemaVersion: validation.document.schemaVersion,
      document: validation.document,
      revision: document.revision + 1,
      updatedAt: new Date("2026-01-02T00:00:00.000Z")
    };
    const index = this.documents.findIndex(
      (existingDocument) => existingDocument.id === document.id
    );

    this.documents.splice(index, 1, nextDocument);

    return nextDocument;
  }
}

function createProject(input: {
  readonly id?: string;
  readonly organizationId?: string;
  readonly name?: string;
  readonly slug?: string;
  readonly deletedAt?: Date | null;
}): Project {
  return {
    id: input.id ?? "project",
    organizationId: input.organizationId ?? "org-a",
    name: input.name ?? "Demo Store",
    slug: input.slug ?? "demo-store",
    status: "DRAFT",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: input.deletedAt ?? null
  };
}

function createPage(input: {
  readonly id?: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly isHome?: boolean;
  readonly deletedAt?: Date | null;
}): SitePage {
  return {
    id: input.id ?? "page",
    organizationId: input.organizationId ?? "org-a",
    projectId: input.projectId ?? "project-a",
    title: input.title ?? "Главная",
    slug: input.slug ?? "home",
    status: "DRAFT",
    isHome: input.isHome ?? false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: input.deletedAt ?? null
  };
}

function createPageDocument(input: {
  readonly id?: string;
  readonly organizationId?: string;
  readonly projectId?: string;
  readonly pageId?: string;
  readonly revision?: number;
  readonly document?: PageDocumentRecord["document"];
}): PageDocumentRecord {
  return {
    id: input.id ?? "page-document",
    organizationId: input.organizationId ?? "org-a",
    projectId: input.projectId ?? "project-a",
    pageId: input.pageId ?? "page-a",
    schemaVersion: 1,
    document: input.document ?? createEmptyPageDocument(),
    revision: input.revision ?? 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z")
  };
}

async function expectHttpError(
  promise: Promise<unknown>,
  status: number,
  code: string
): Promise<void> {
  let caughtError: unknown;

  try {
    await promise;
  } catch (error) {
    caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(HttpException);

  if (!(caughtError instanceof HttpException)) {
    throw new Error("Expected HttpException");
  }

  expect(caughtError.getStatus()).toBe(status);
  expect(caughtError.getResponse()).toMatchObject({
    code
  });
}
