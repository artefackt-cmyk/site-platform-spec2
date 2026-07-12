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
  MediaAssetRepository,
  MembershipRepository,
  OrderRepository,
  OrganizationCreationService,
  PageDocumentInvalidError,
  PageDocumentRepository,
  PageDocumentRevisionConflictError,
  ProductMediaRepository,
  ProductMediaRepositoryError,
  ProductRepository,
  ProductVariantRepository,
  ProjectOrderCounterRepository,
  ProjectPublicationSettingsRepository,
  ProjectRepository,
  PublishedPageSnapshotRepository,
  PublishedPageStateRepository,
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

    it("enforces tenant-aware product and variant repository rules", async () => {
      const currentClient = getClient(client);
      const projectRepository = new ProjectRepository(currentClient);
      const productRepository = new ProductRepository(currentClient);
      const variantRepository = new ProductVariantRepository(currentClient);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantB = await createOrganizationFixture(currentClient, "tenant-b");
      const tenantAContext = createTenantContext(tenantA);
      const tenantBContext = createTenantContext(tenantB);
      const projectA = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Tenant A Product Project",
        slug: "tenant-a-product-project"
      });
      const projectB = await projectRepository.create({
        organizationId: tenantB.organization.id,
        name: "Tenant B Product Project",
        slug: "tenant-b-product-project"
      });
      const productA = await productRepository.create({
        tenantContext: tenantAContext,
        projectId: projectA.id,
        title: "Tenant A Product",
        slug: "shared-product",
        createdByUserId: tenantA.user.id,
        updatedByUserId: tenantA.user.id
      });
      const productB = await productRepository.create({
        tenantContext: tenantBContext,
        projectId: projectB.id,
        title: "Tenant B Product",
        slug: "shared-product",
        createdByUserId: tenantB.user.id,
        updatedByUserId: tenantB.user.id
      });

      if (productA === null || productB === null) {
        throw new Error("Expected product fixtures.");
      }

      await expect(
        productRepository.findByIdForProject(
          tenantAContext,
          projectA.id,
          productA.id
        )
      ).resolves.toMatchObject({
        id: productA.id
      });
      await expect(
        productRepository.findByIdForProject(
          tenantAContext,
          projectB.id,
          productB.id
        )
      ).resolves.toBeNull();
      await expect(
        productRepository.create({
          tenantContext: tenantAContext,
          projectId: projectA.id,
          title: "Duplicate Product",
          slug: "shared-product",
          createdByUserId: tenantA.user.id,
          updatedByUserId: tenantA.user.id
        })
      ).rejects.toThrow();

      const variantA = await variantRepository.create({
        tenantContext: tenantAContext,
        projectId: projectA.id,
        productId: productA.id,
        title: "Default",
        sku: "SKU-001",
        priceMinor: 129900,
        stockQuantity: 5,
        trackInventory: true,
        allowBackorder: false,
        isDefault: true
      });

      if (variantA === null) {
        throw new Error("Expected variant fixture.");
      }

      await expect(
        variantRepository.create({
          tenantContext: tenantAContext,
          projectId: projectA.id,
          productId: productA.id,
          title: "Duplicate SKU",
          sku: "SKU-001",
          priceMinor: 9900,
          stockQuantity: 1,
          trackInventory: true,
          allowBackorder: false
        })
      ).rejects.toThrow();

      await productRepository.softDelete(
        tenantAContext,
        projectA.id,
        productA.id,
        tenantA.user.id
      );
      await expect(
        productRepository.findByIdForProject(
          tenantAContext,
          projectA.id,
          productA.id
        )
      ).resolves.toBeNull();
    });

    it("creates tenant-safe orders with snapshots and idempotency lookup", async () => {
      const currentClient = getClient(client);
      const tenantA = await createOrganizationFixture(currentClient, "tenant-a");
      const tenantB = await createOrganizationFixture(currentClient, "tenant-b");
      const tenantAContext = createTenantContext(tenantA);
      const tenantBContext = createTenantContext(tenantB);
      const projectRepository = new ProjectRepository(currentClient);
      const orderRepository = new OrderRepository(currentClient);
      const counterRepository = new ProjectOrderCounterRepository(currentClient);
      const projectA = await projectRepository.create({
        organizationId: tenantA.organization.id,
        name: "Tenant A Orders",
        slug: "tenant-a-orders"
      });
      const projectB = await projectRepository.create({
        organizationId: tenantB.organization.id,
        name: "Tenant B Orders",
        slug: "tenant-b-orders"
      });
      const orderNumber = await counterRepository.nextOrderNumber({
        organizationId: tenantA.organization.id,
        projectId: projectA.id
      });
      const nextOrderNumber = await counterRepository.nextOrderNumber({
        organizationId: tenantA.organization.id,
        projectId: projectA.id
      });

      expect(orderNumber).toBe(1001);
      expect(nextOrderNumber).toBe(1002);

      const order = await orderRepository.create({
        organizationId: tenantA.organization.id,
        projectId: projectA.id,
        orderNumber,
        currency: "RUB",
        subtotalMinor: 129900,
        totalMinor: 129900,
        customerName: "Анна",
        customerEmail: "anna@example.com",
        idempotencyKey: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2",
        idempotencyPayloadHash: "payload-hash",
        publicHandleSnapshot: "demo-store",
        publicTokenHash: "token-hash",
        items: [
          {
            productId: null,
            variantId: null,
            productNameSnapshot: "Snapshot Product",
            variantNameSnapshot: "Default",
            skuSnapshot: "SKU-001",
            unitPriceMinor: 129900,
            quantity: 1,
            lineTotalMinor: 129900,
            currency: "RUB",
            inventoryDecremented: true
          }
        ]
      });

      expect(order.items[0]).toMatchObject({
        productNameSnapshot: "Snapshot Product",
        unitPriceMinor: 129900
      });
      await expect(
        orderRepository.findByProjectAndIdempotency({
          projectId: projectA.id,
          idempotencyKey: "8d30d36e-5984-4c21-a66f-40f6f7dc71c2"
        })
      ).resolves.toMatchObject({
        id: order.id
      });
      await expect(
        orderRepository.getByProjectAndId({
          tenantContext: tenantBContext,
          projectId: projectB.id,
          orderId: order.id
        })
      ).resolves.toBeNull();
      await expect(
        orderRepository.findByPublicTokenHash("token-hash")
      ).resolves.toMatchObject({
        id: order.id
      });
      await expect(
        orderRepository.listByProject({
          tenantContext: tenantAContext,
          projectId: projectA.id,
          search: "anna"
        })
      ).resolves.toHaveLength(1);
    });

    it("manages product media with tenant and project isolation", async () => {
      const currentClient = getClient(client);
      const tenantAFixture = await createPageFixture(currentClient, "tenant-a");
      const tenantBFixture = await createPageFixture(currentClient, "tenant-b");
      const productRepository = new ProductRepository(currentClient);
      const productMediaRepository = new ProductMediaRepository(currentClient);
      const mediaAssetRepository = new MediaAssetRepository(currentClient);
      const product = await productRepository.create({
        tenantContext: tenantAFixture.context,
        projectId: tenantAFixture.project.id,
        title: "Gallery Product",
        slug: "gallery-product",
        createdByUserId: tenantAFixture.context.userId,
        updatedByUserId: tenantAFixture.context.userId
      });
      const firstAsset = await createMediaAssetFixture(
        currentClient,
        tenantAFixture.context,
        tenantAFixture.project.id,
        "gallery-first"
      );
      const secondAsset = await createMediaAssetFixture(
        currentClient,
        tenantAFixture.context,
        tenantAFixture.project.id,
        "gallery-second"
      );
      const thirdAsset = await createMediaAssetFixture(
        currentClient,
        tenantAFixture.context,
        tenantAFixture.project.id,
        "gallery-third"
      );
      const foreignAsset = await createMediaAssetFixture(
        currentClient,
        tenantBFixture.context,
        tenantBFixture.project.id,
        "gallery-foreign"
      );

      if (product === null) {
        throw new Error("Expected product fixture.");
      }

      const firstImage = await productMediaRepository.add({
        tenantContext: tenantAFixture.context,
        projectId: tenantAFixture.project.id,
        productId: product.id,
        mediaAssetId: firstAsset.id
      });
      const secondImage = await productMediaRepository.add({
        tenantContext: tenantAFixture.context,
        projectId: tenantAFixture.project.id,
        productId: product.id,
        mediaAssetId: secondAsset.id
      });
      const thirdImage = await productMediaRepository.add({
        tenantContext: tenantAFixture.context,
        projectId: tenantAFixture.project.id,
        productId: product.id,
        mediaAssetId: thirdAsset.id
      });

      await expect(
        productMediaRepository.add({
          tenantContext: tenantAFixture.context,
          projectId: tenantAFixture.project.id,
          productId: product.id,
          mediaAssetId: firstAsset.id
        })
      ).rejects.toBeInstanceOf(ProductMediaRepositoryError);
      await expect(
        productMediaRepository.add({
          tenantContext: tenantAFixture.context,
          projectId: tenantAFixture.project.id,
          productId: product.id,
          mediaAssetId: foreignAsset.id
        })
      ).rejects.toBeInstanceOf(ProductMediaRepositoryError);

      await productMediaRepository.setPrimary(
        tenantAFixture.context,
        tenantAFixture.project.id,
        product.id,
        secondImage.id
      );
      await expect(
        productMediaRepository.listByProduct(
          tenantAFixture.context,
          tenantAFixture.project.id,
          product.id
        )
      ).resolves.toEqual([
        expect.objectContaining({
          id: firstImage.id,
          isPrimary: false
        }),
        expect.objectContaining({
          id: secondImage.id,
          isPrimary: true
        }),
        expect.objectContaining({
          id: thirdImage.id,
          isPrimary: false
        })
      ]);

      await productMediaRepository.remove(
        tenantAFixture.context,
        tenantAFixture.project.id,
        product.id,
        secondImage.id
      );
      await expect(
        productMediaRepository.listByProduct(
          tenantAFixture.context,
          tenantAFixture.project.id,
          product.id
        )
      ).resolves.toEqual([
        expect.objectContaining({
          id: firstImage.id,
          isPrimary: true,
          position: 0
        }),
        expect.objectContaining({
          id: thirdImage.id,
          position: 1
        })
      ]);

      await productMediaRepository.reorder(
        tenantAFixture.context,
        tenantAFixture.project.id,
        product.id,
        [thirdImage.id, firstImage.id]
      );
      await expect(
        productMediaRepository.listByProduct(
          tenantAFixture.context,
          tenantAFixture.project.id,
          product.id
        )
      ).resolves.toEqual([
        expect.objectContaining({
          id: thirdImage.id,
          position: 0
        }),
        expect.objectContaining({
          id: firstImage.id,
          position: 1
        })
      ]);

      await expect(
        mediaAssetRepository.countUsage(
          tenantAFixture.context,
          tenantAFixture.project.id,
          firstAsset.id
        )
      ).resolves.toMatchObject({
        usageCount: 1,
        productIds: [product.id]
      });
      await expect(
        mediaAssetRepository.delete(
          tenantAFixture.context,
          tenantAFixture.project.id,
          firstAsset.id
        )
      ).rejects.toThrow();
    });

    it("rejects product media above the MVP limit", async () => {
      const currentClient = getClient(client);
      const fixture = await createPageFixture(currentClient, "tenant-limit");
      const product = await new ProductRepository(currentClient).create({
        tenantContext: fixture.context,
        projectId: fixture.project.id,
        title: "Limited Gallery Product",
        slug: "limited-gallery-product",
        createdByUserId: fixture.context.userId,
        updatedByUserId: fixture.context.userId
      });
      const productMediaRepository = new ProductMediaRepository(currentClient);

      if (product === null) {
        throw new Error("Expected product fixture.");
      }

      for (let index = 0; index < 10; index += 1) {
        const asset = await createMediaAssetFixture(
          currentClient,
          fixture.context,
          fixture.project.id,
          `limit-${index}`
        );

        await productMediaRepository.add({
          tenantContext: fixture.context,
          projectId: fixture.project.id,
          productId: product.id,
          mediaAssetId: asset.id
        });
      }

      const extraAsset = await createMediaAssetFixture(
        currentClient,
        fixture.context,
        fixture.project.id,
        "limit-extra"
      );

      await expect(
        productMediaRepository.add({
          tenantContext: fixture.context,
          projectId: fixture.project.id,
          productId: product.id,
          mediaAssetId: extraAsset.id
        })
      ).rejects.toBeInstanceOf(ProductMediaRepositoryError);
    });

    it("counts legacy primary media as migration compatibility", async () => {
      const currentClient = getClient(client);
      const fixture = await createPageFixture(currentClient, "tenant-legacy");
      const asset = await createMediaAssetFixture(
        currentClient,
        fixture.context,
        fixture.project.id,
        "legacy-primary"
      );
      const product = await new ProductRepository(currentClient).create({
        tenantContext: fixture.context,
        projectId: fixture.project.id,
        title: "Legacy Product",
        slug: "legacy-product",
        primaryMediaAssetId: asset.id,
        createdByUserId: fixture.context.userId,
        updatedByUserId: fixture.context.userId
      });

      if (product === null) {
        throw new Error("Expected product fixture.");
      }

      await expect(
        new MediaAssetRepository(currentClient).countUsage(
          fixture.context,
          fixture.project.id,
          asset.id
        )
      ).resolves.toMatchObject({
        usageCount: 1,
        productIds: [product.id]
      });
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
          schemaVersion: 2
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
            children: [
              expect.objectContaining({
                type: "section",
                children: [expect.objectContaining({ type: "heading" })]
              })
            ]
          }
        }
      });
    });

    it("migrates stored V1 page documents in memory when reading", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const pageDocumentRepository = new PageDocumentRepository(currentClient);

      await currentClient.pageDocument.create({
        data: {
          organizationId: context.organizationId,
          projectId: project.id,
          pageId: page.id,
          schemaVersion: 1,
          revision: 1,
          document: {
            schemaVersion: 1,
            root: {
              id: "root",
              type: "page",
              children: [
                {
                  id: "legacy-heading",
                  type: "heading",
                  props: {
                    text: "Legacy",
                    level: 1,
                    align: "left"
                  }
                }
              ]
            }
          }
        }
      });

      await expect(
        pageDocumentRepository.findByPage(context, project.id, page.id)
      ).resolves.toMatchObject({
        schemaVersion: 2,
        document: {
          schemaVersion: 2,
          root: {
            children: [
              expect.objectContaining({
                id: "root-section-v2",
                children: [expect.objectContaining({ id: "legacy-heading" })]
              })
            ]
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
            root: {
              id: "root",
              type: "page",
              children: [
                {
                  id: "bad-root-child",
                  type: "heading",
                  props: {
                    text: "Bad",
                    level: 1,
                    align: "left"
                  }
                }
              ]
            }
          },
          initialDocument.revision
        )
      ).rejects.toBeInstanceOf(PageDocumentInvalidError);
    });

    it("lists media assets only inside the active tenant project", async () => {
      const currentClient = getClient(client);
      const tenantAFixture = await createPageFixture(currentClient, "tenant-a");
      const tenantBFixture = await createPageFixture(currentClient, "tenant-b");
      const mediaAssetRepository = new MediaAssetRepository(currentClient);
      const tenantAAsset = await createMediaAssetFixture(
        currentClient,
        tenantAFixture.context,
        tenantAFixture.project.id,
        "tenant-a"
      );

      const tenantBAsset = await createMediaAssetFixture(
        currentClient,
        tenantBFixture.context,
        tenantBFixture.project.id,
        "tenant-b"
      );

      await expect(
        mediaAssetRepository.listByProject(
          tenantAFixture.context,
          tenantAFixture.project.id
        )
      ).resolves.toEqual([expect.objectContaining({ id: tenantAAsset.id })]);

      await expect(
        mediaAssetRepository.findByIdForProject(
          tenantAFixture.context,
          tenantAFixture.project.id,
          tenantBAsset.id
        )
      ).resolves.toBeNull();
    });

    it("counts media usage in saved page documents", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const mediaAssetRepository = new MediaAssetRepository(currentClient);
      const pageDocumentRepository = new PageDocumentRepository(currentClient);
      const asset = await createMediaAssetFixture(
        currentClient,
        context,
        project.id,
        "used"
      );
      const pageDocument = await pageDocumentRepository.createDefault(
        context,
        project.id,
        page.id
      );

      if (pageDocument === null) {
        throw new Error("Expected page document fixture.");
      }

      const documentWithImage = insertBlock(pageDocument.document, {
        ...createDefaultBlock("image"),
        props: {
          ...createDefaultBlock("image").props,
          assetId: asset.id,
          src: "http://localhost:3002/api/projects/project/media/asset/content",
          alt: "Used image"
        }
      });

      await pageDocumentRepository.save(
        context,
        project.id,
        page.id,
        documentWithImage,
        pageDocument.revision
      );

      await expect(
        mediaAssetRepository.countUsage(context, project.id, asset.id)
      ).resolves.toEqual({
        usageCount: 1,
        pageIds: [page.id],
        productIds: []
      });
    });

    it("enforces public handle uniqueness and tenant-scoped settings", async () => {
      const currentClient = getClient(client);
      const tenantA = await createPageFixture(currentClient, "tenant-a");
      const tenantB = await createPageFixture(currentClient, "tenant-b");
      const settingsRepository = new ProjectPublicationSettingsRepository(
        currentClient
      );

      await expect(
        settingsRepository.create({
          tenantContext: tenantA.context,
          projectId: tenantA.project.id,
          publicHandle: "shared-handle"
        })
      ).resolves.toMatchObject({
        publicHandle: "shared-handle"
      });

      await expect(
        settingsRepository.create({
          tenantContext: tenantB.context,
          projectId: tenantB.project.id,
          publicHandle: "shared-handle"
        })
      ).rejects.toThrow();

      await expect(
        settingsRepository.findByProject(tenantA.context, tenantB.project.id)
      ).resolves.toBeNull();
    });

    it("increments publication snapshot versions without mutating draft", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const snapshotRepository = new PublishedPageSnapshotRepository(currentClient);
      const firstSnapshot = await snapshotRepository.create({
        tenantContext: context,
        projectId: project.id,
        pageId: page.id,
        pageTitle: page.title,
        pageSlug: page.slug,
        document: createEmptyPageDocument(),
        sourceRevision: 1,
        publishedByUserId: context.userId
      });
      const secondSnapshot = await snapshotRepository.create({
        tenantContext: context,
        projectId: project.id,
        pageId: page.id,
        pageTitle: page.title,
        pageSlug: page.slug,
        document: insertBlock(createEmptyPageDocument(), createDefaultBlock("text")),
        sourceRevision: 2,
        publishedByUserId: context.userId
      });

      expect(firstSnapshot).toMatchObject({
        version: 1,
        sourceRevision: 1
      });
      expect(secondSnapshot).toMatchObject({
        version: 2,
        sourceRevision: 2
      });
      await expect(
        new PageDocumentRepository(currentClient).findByPage(
          context,
          project.id,
          page.id
        )
      ).resolves.toBeNull();
    });

    it("public lookup returns only active snapshots and hides unpublished pages", async () => {
      const currentClient = getClient(client);
      const { context, project, page } = await createPageFixture(currentClient);
      const settingsRepository = new ProjectPublicationSettingsRepository(
        currentClient
      );
      const snapshotRepository = new PublishedPageSnapshotRepository(currentClient);
      const stateRepository = new PublishedPageStateRepository(currentClient);

      await settingsRepository.create({
        tenantContext: context,
        projectId: project.id,
        publicHandle: "public-lookup"
      });
      const snapshot = await snapshotRepository.create({
        tenantContext: context,
        projectId: project.id,
        pageId: page.id,
        pageTitle: page.title,
        pageSlug: page.slug,
        document: createEmptyPageDocument(),
        sourceRevision: 1,
        publishedByUserId: context.userId
      });

      if (snapshot === null) {
        throw new Error("Expected publication snapshot fixture.");
      }

      await expect(
        snapshotRepository.findActivePageByHandleAndSlug(
          "public-lookup",
          page.slug
        )
      ).resolves.toBeNull();

      await stateRepository.activate({
        tenantContext: context,
        projectId: project.id,
        pageId: page.id,
        snapshotId: snapshot.id,
        publishedAt: snapshot.publishedAt
      });

      await expect(
        snapshotRepository.findActivePageByHandleAndSlug(
          "public-lookup",
          page.slug
        )
      ).resolves.toMatchObject({
        snapshot: {
          id: snapshot.id
        }
      });

      await stateRepository.unpublish(context, project.id, page.id, new Date());

      await expect(
        snapshotRepository.findActivePageByHandleAndSlug(
          "public-lookup",
          page.slug
        )
      ).resolves.toBeNull();
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
  await client.orderItem.deleteMany();
  await client.order.deleteMany();
  await client.projectOrderCounter.deleteMany();
  await client.publishedPageState.deleteMany();
  await client.publishedPageSnapshot.deleteMany();
  await client.projectPublicationSettings.deleteMany();
  await client.productMedia.deleteMany();
  await client.productVariant.deleteMany();
  await client.product.deleteMany();
  await client.mediaAsset.deleteMany();
  await client.pageDocument.deleteMany();
  await client.sitePage.deleteMany();
  await client.project.deleteMany();
  await client.membership.deleteMany();
  await client.organization.deleteMany();
  await client.user.deleteMany();
}

async function createMediaAssetFixture(
  client: DatabasePrismaClient,
  context: ReturnType<typeof createTenantContext>,
  projectId: string,
  prefix: string
) {
  const mediaAssetRepository = new MediaAssetRepository(client);
  const asset = await mediaAssetRepository.create({
    tenantContext: context,
    projectId,
    storageKey: `organizations/${context.organizationId}/projects/${projectId}/${createDeterministicUuid(
      prefix
    )}.png`,
    originalFilename: `${prefix}.png`,
    mimeType: "image/png",
    sizeBytes: 67,
    width: 1,
    height: 1,
    altText: `${prefix} image`,
    createdByUserId: context.userId
  });

  if (asset === null) {
    throw new Error("Expected media asset fixture.");
  }

  return asset;
}

function createDeterministicUuid(prefix: string): string {
  const hex = Buffer.from(prefix).toString("hex").padEnd(32, "0").slice(0, 32);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(
    13,
    16
  )}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
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
