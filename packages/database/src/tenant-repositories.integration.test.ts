import { loadConfigSafe, type AppConfig } from "@site-platform/config";
import {
  createDefaultBlock,
  createEmptyPageDocument,
  insertBlock
} from "@site-platform/editor-core";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  assertSafeTestDatabaseConfig,
  checkDatabaseConnection,
  createPrismaClient,
  disconnectPrismaClient,
  MembershipRepository,
  OrganizationCreationService,
  PageDocumentInvalidError,
  PageDocumentRepository,
  PageDocumentRevisionConflictError,
  ProjectRepository,
  SitePageRepository,
  UserRepository,
  type DatabasePrismaClient
} from "./index";

const integrationConfig = await getAvailableIntegrationConfig();

describe.skipIf(integrationConfig === undefined)(
  "tenant-aware repositories",
  () => {
    let client: DatabasePrismaClient | undefined;

    beforeAll(() => {
      if (integrationConfig !== undefined) {
        client = createPrismaClient(integrationConfig);
      }
    });

    afterAll(async () => {
      if (client !== undefined) {
        await clearDatabase(client);
        await disconnectPrismaClient(client);
      }
    });

    beforeEach(async () => {
      await clearDatabase(getClient(client));
    });

    it("allows tenant A to read its own project", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const project = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Tenant A Project",
        slug: "tenant-a-project"
      });

      const foundProject = await projectRepository.findByOrganizationAndId({
        organizationId: tenantA.organization.id,
        projectId: project.id
      });

      expect(foundProject?.id).toBe(project.id);
    });

    it("returns not found when tenant A reads tenant B project", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantB = await createOrganizationFixture(currentClient, "tenant-b");
      const projectB = await projectRepository.create({
        organizationId: tenantB.organization.id,
        name: "Tenant B Project",
        slug: "tenant-b-project"
      });

      const foundProject = await projectRepository.findByOrganizationAndId({
        organizationId: tenantA.organization.id,
        projectId: projectB.id
      });

      expect(foundProject).toBeNull();
    });

    it("allows the same project slug in different organizations", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantB = await createOrganizationFixture(currentClient, "tenant-b");

      await expect(
        projectRepository.create({
          organizationId: tenantA.organization.id,
          name: "Shared Slug A",
          slug: "shared-slug"
        })
      ).resolves.toMatchObject({
        slug: "shared-slug"
      });

      await expect(
        projectRepository.create({
          organizationId: tenantB.organization.id,
          name: "Shared Slug B",
          slug: "shared-slug"
        })
      ).resolves.toMatchObject({
        slug: "shared-slug"
      });
    });

    it("rejects duplicate project slugs inside one organization", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");

      await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "First Project",
        slug: "duplicate-slug"
      });

      await expect(
        projectRepository.create({
          organizationId: tenantA.organization.id,
          name: "Second Project",
          slug: "duplicate-slug"
        })
      ).rejects.toThrow();
    });

    it("enforces unique Membership by userId and organizationId", async () => {
      const currentClient = getClient(client);
      const membershipRepository = new MembershipRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");

      await expect(
        membershipRepository.create({
          userId: tenantA.user.id,
          organizationId: tenantA.organization.id,
          role: "ADMIN"
        })
      ).rejects.toThrow();
    });

    it("creates OWNER Membership when creating organization", async () => {
      const currentClient = getClient(client);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const membershipRepository = new MembershipRepository(currentClient);

      const membership = await membershipRepository.findByUserAndOrganization({
        userId: tenantA.user.id,
        organizationId: tenantA.organization.id
      });

      expect(membership).toMatchObject({
        role: "OWNER"
      });
    });

    it("creates AuditLog when creating organization", async () => {
      const currentClient = getClient(client);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const auditLogs = await currentClient.auditLog.findMany({
        where: {
          organizationId: tenantA.organization.id,
          action: "organization.created"
        }
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0]).toMatchObject({
        entityType: "Organization",
        entityId: tenantA.organization.id
      });
    });

    it("does not return soft-deleted projects from normal queries", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const project = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Archived Project",
        slug: "archived-project"
      });

      await projectRepository.softDelete({
        organizationId: tenantA.organization.id,
        projectId: project.id
      });

      await expect(
        projectRepository.findByOrganizationAndId({
          organizationId: tenantA.organization.id,
          projectId: project.id
        })
      ).resolves.toBeNull();

      await expect(
        projectRepository.listByOrganization(tenantA.organization.id)
      ).resolves.toEqual([]);
    });

    it("allows the same page slug in different projects", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const sitePageRepository = new SitePageRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const context = createTenantContext(tenantA);
      const firstProject = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "First Project",
        slug: "first-project"
      });
      const secondProject = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Second Project",
        slug: "second-project"
      });

      await expect(
        sitePageRepository.create(context, firstProject.id, {
          title: "Shared Page",
          slug: "shared"
        })
      ).resolves.toMatchObject({
        slug: "shared"
      });

      await expect(
        sitePageRepository.create(context, secondProject.id, {
          title: "Shared Page",
          slug: "shared"
        })
      ).resolves.toMatchObject({
        slug: "shared"
      });
    });

    it("rejects duplicate page slugs inside one project", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const sitePageRepository = new SitePageRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const context = createTenantContext(tenantA);
      const project = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Tenant Project",
        slug: "tenant-project"
      });

      await sitePageRepository.create(context, project.id, {
        title: "First Page",
        slug: "duplicate"
      });

      await expect(
        sitePageRepository.create(context, project.id, {
          title: "Second Page",
          slug: "duplicate"
        })
      ).rejects.toThrow();
    });

    it("does not let tenant A read tenant B page", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const sitePageRepository = new SitePageRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantB = await createOrganizationFixture(currentClient, "tenant-b");
      const tenantBContext = createTenantContext(tenantB);
      const projectB = await projectRepository.create({
        organizationId: tenantB.organization.id,
        name: "Tenant B Project",
        slug: "tenant-b-project"
      });
      const pageB = await sitePageRepository.create(tenantBContext, projectB.id, {
        title: "Tenant B Page",
        slug: "tenant-b-page"
      });

      if (pageB === null) {
        throw new Error("Expected tenant B page fixture.");
      }

      await expect(
        sitePageRepository.findById(
          createTenantContext(tenantA),
          projectB.id,
          pageB.id
        )
      ).resolves.toBeNull();
    });

    it("keeps only one home page when setting a new home page", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const sitePageRepository = new SitePageRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const context = createTenantContext(tenantA);
      const project = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Home Project",
        slug: "home-project"
      });
      await sitePageRepository.create(context, project.id, {
        title: "Home",
        slug: "home",
        isHome: true
      });
      const catalogPage = await sitePageRepository.create(context, project.id, {
        title: "Catalog",
        slug: "catalog"
      });

      if (catalogPage === null) {
        throw new Error("Expected catalog page fixture.");
      }

      await expect(
        sitePageRepository.setHomePage(context, project.id, catalogPage.id)
      ).resolves.toMatchObject({
        id: catalogPage.id,
        isHome: true
      });

      const pages = await sitePageRepository.listByProject(context, project.id);
      const homePages = pages.filter((page) => page.isHome);

      expect(homePages).toHaveLength(1);
      expect(homePages[0]?.id).toBe(catalogPage.id);
    });

    it("hides soft-deleted pages from normal queries", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const sitePageRepository = new SitePageRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const context = createTenantContext(tenantA);
      const project = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Soft Delete Project",
        slug: "soft-delete-project"
      });
      const page = await sitePageRepository.create(context, project.id, {
        title: "Hidden Page",
        slug: "hidden-page"
      });

      if (page === null) {
        throw new Error("Expected page fixture.");
      }

      await sitePageRepository.softDelete(context, project.id, page.id);

      await expect(
        sitePageRepository.findById(context, project.id, page.id)
      ).resolves.toBeNull();
      await expect(
        sitePageRepository.listByProject(context, project.id)
      ).resolves.toEqual([]);
    });

    it("creates a page document for the correct page", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const pageDocumentRepository = new PageDocumentRepository(currentClient);

      await expect(
        pageDocumentRepository.createDefault(context, project.id, page.id)
      ).resolves.toMatchObject({
        pageId: page.id,
        revision: 1,
        document: {
          schemaVersion: 1
        }
      });
    });

    it("does not expose another tenant page document", async () => {
      const currentClient = getClient(client);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantBFixture = await createPageFixture(currentClient, "tenant-b");
      const pageDocumentRepository = new PageDocumentRepository(currentClient);

      await pageDocumentRepository.createDefault(
        tenantBFixture.context,
        tenantBFixture.project.id,
        tenantBFixture.page.id
      );

      await expect(
        pageDocumentRepository.findByPage(
          createTenantContext(tenantA),
          tenantBFixture.project.id,
          tenantBFixture.page.id
        )
      ).resolves.toBeNull();
    });

    it("returns null when creating a document for a foreign page", async () => {
      const currentClient = getClient(client);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantBFixture = await createPageFixture(currentClient, "tenant-b");
      const pageDocumentRepository = new PageDocumentRepository(currentClient);

      await expect(
        pageDocumentRepository.createDefault(
          createTenantContext(tenantA),
          tenantBFixture.project.id,
          tenantBFixture.page.id
        )
      ).resolves.toBeNull();
    });

    it("increments revision when saving a valid document", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const pageDocumentRepository = new PageDocumentRepository(currentClient);
      const initialDocument = await pageDocumentRepository.createDefault(
        context,
        project.id,
        page.id
      );

      if (initialDocument === null) {
        throw new Error("Expected page document fixture.");
      }

      const nextDocument = insertBlock(
        initialDocument.document,
        createDefaultBlock("heading")
      );

      await expect(
        pageDocumentRepository.save(
          context,
          project.id,
          page.id,
          nextDocument,
          initialDocument.revision
        )
      ).resolves.toMatchObject({
        revision: 2,
        document: {
          root: {
            children: [expect.objectContaining({ type: "heading" })]
          }
        }
      });
    });

    it("rejects stale expectedRevision with a stable conflict error", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const pageDocumentRepository = new PageDocumentRepository(currentClient);
      const initialDocument = await pageDocumentRepository.createDefault(
        context,
        project.id,
        page.id
      );

      if (initialDocument === null) {
        throw new Error("Expected page document fixture.");
      }

      await pageDocumentRepository.save(
        context,
        project.id,
        page.id,
        insertBlock(initialDocument.document, createDefaultBlock("text")),
        initialDocument.revision
      );

      await expect(
        pageDocumentRepository.save(
          context,
          project.id,
          page.id,
          insertBlock(initialDocument.document, createDefaultBlock("heading")),
          initialDocument.revision
        )
      ).rejects.toBeInstanceOf(PageDocumentRevisionConflictError);
    });

    it("does not save invalid documents", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const pageDocumentRepository = new PageDocumentRepository(currentClient);
      const initialDocument = await pageDocumentRepository.createDefault(
        context,
        project.id,
        page.id
      );

      if (initialDocument === null) {
        throw new Error("Expected page document fixture.");
      }

      await expect(
        pageDocumentRepository.save(
          context,
          project.id,
          page.id,
          {
            ...createEmptyPageDocument(),
            schemaVersion: 2
          },
          initialDocument.revision
        )
      ).rejects.toBeInstanceOf(PageDocumentInvalidError);
    });
  }
);

type OrganizationFixture = {
  readonly user: Awaited<ReturnType<UserRepository["create"]>>;
  readonly organization: Awaited<
    ReturnType<OrganizationCreationService["createOrganizationWithOwner"]>
  >["organization"];
};

async function getAvailableIntegrationConfig(): Promise<AppConfig | undefined> {
  const result = loadConfigSafe({
    overrides: {
      NODE_ENV: "test"
    }
  });

  if (!result.ok) {
    return undefined;
  }

  try {
    assertSafeTestDatabaseConfig(result.config);
  } catch {
    return undefined;
  }

  const client = createPrismaClient(result.config);

  try {
    const connectionResult = await checkDatabaseConnection(client);

    return connectionResult.ok ? result.config : undefined;
  } finally {
    await disconnectPrismaClient(client);
  }
}

function getClient(
  client: DatabasePrismaClient | undefined
): DatabasePrismaClient {
  if (client === undefined) {
    throw new Error("Database integration test client was not initialized.");
  }

  return client;
}

async function createOrganizationFixture(
  client: DatabasePrismaClient,
  slugPrefix: string
): Promise<OrganizationFixture> {
  const suffix = createTestSuffix();
  const userRepository = new UserRepository(client);
  const organizationService = new OrganizationCreationService(client);
  const user = await userRepository.create({
    email: `${slugPrefix}-${suffix}@example.test`,
    displayName: `${slugPrefix} owner`
  });
  const { organization } =
    await organizationService.createOrganizationWithOwner({
      name: `${slugPrefix} organization`,
      slug: `${slugPrefix}-${suffix}`,
      ownerUserId: user.id
    });

  return {
    user,
    organization
  };
}

async function clearDatabase(client: DatabasePrismaClient): Promise<void> {
  await client.auditLog.deleteMany();
  await client.pageDocument.deleteMany();
  await client.sitePage.deleteMany();
  await client.project.deleteMany();
  await client.membership.deleteMany();
  await client.organization.deleteMany();
  await client.user.deleteMany();
}

function createTenantContext(fixture: OrganizationFixture) {
  return {
    organizationId: fixture.organization.id,
    userId: fixture.user.id,
    membershipId: "integration-test-membership",
    role: "OWNER"
  } as const;
}

async function createPageFixture(
  client: DatabasePrismaClient,
  slugPrefix = "tenant-a"
) {
  const tenant = await createOrganizationFixture(client, slugPrefix);
  const context = createTenantContext(tenant);
  const projectRepository = new ProjectRepository(client);
  const sitePageRepository = new SitePageRepository(client);
  const project = await projectRepository.create({
    organizationId: tenant.organization.id,
    name: `${slugPrefix} Project`,
    slug: `${slugPrefix}-project-${createTestSuffix()}`
  });
  const page = await sitePageRepository.create(context, project.id, {
    title: `${slugPrefix} Page`,
    slug: `${slugPrefix}-page`
  });

  if (page === null) {
    throw new Error("Expected page fixture.");
  }

  return {
    context,
    project,
    page
  };
}

function createTestSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
