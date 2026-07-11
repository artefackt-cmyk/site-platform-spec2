import "reflect-metadata";
import { HttpException } from "@nestjs/common";
import type { Project } from "@site-platform/database";
import type { OrganizationRole, TenantContext } from "@site-platform/domain";
import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "./api-errors";
import type { ActiveIdentity, CurrentIdentityResolver } from "./current-identity";
import type { CreateDraftProjectInput, ProjectStore } from "./project-store";
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

type CreateProjectsServiceOptions = {
  readonly role?: OrganizationRole;
  readonly projects?: readonly Project[];
};

function createProjectsService(options: CreateProjectsServiceOptions = {}): {
  readonly service: ProjectsService;
  readonly projectStore: InMemoryProjectStore;
} {
  const role = options.role ?? "OWNER";
  const currentIdentityResolver: CurrentIdentityResolver = {
    getCurrentIdentity: async () => createIdentity(role)
  };
  const projectStore = new InMemoryProjectStore(options.projects ?? []);

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
  private createdProjects = 0;

  constructor(projects: readonly Project[]) {
    this.projects = [...projects];
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
