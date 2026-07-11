import { loadConfigSafe, type AppConfig } from "@site-platform/config";
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  assertSafeTestDatabaseConfig,
  checkDatabaseConnection,
  createPrismaClient,
  disconnectPrismaClient,
  MembershipRepository,
  OrganizationCreationService,
  ProjectRepository,
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
  await client.project.deleteMany();
  await client.membership.deleteMany();
  await client.organization.deleteMany();
  await client.user.deleteMany();
}

function createTestSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
