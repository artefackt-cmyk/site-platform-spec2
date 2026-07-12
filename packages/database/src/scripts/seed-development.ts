import { loadConfig } from "@site-platform/config";
import { type PageDocumentV2 } from "@site-platform/editor-core";
import { normalizeEmail } from "@site-platform/domain";
import argon2 from "argon2";
import {
  createPrismaClient,
  disconnectPrismaClient,
  toPrismaJson,
  type DatabasePrismaClient
} from "../index";

const DEMO_OWNER_EMAIL = "owner@example.com";
const DEMO_OWNER_DISPLAY_NAME = "Demo Owner";
const DEMO_ORGANIZATION_NAME = "Demo Brand";
const DEMO_ORGANIZATION_SLUG = "demo-brand";
const DEMO_PROJECT_NAME = "Demo Store";
const DEMO_PROJECT_SLUG = "demo-store";
const DEMO_PAGES = [
  {
    title: "Главная",
    slug: "home",
    isHome: true
  },
  {
    title: "Каталог",
    slug: "catalog",
    isHome: false
  },
  {
    title: "О бренде",
    slug: "about",
    isHome: false
  }
] as const;

export async function seedDevelopmentDatabase(
  client: DatabasePrismaClient,
  options: {
    readonly ownerPassword: string;
  }
): Promise<void> {
  const ownerEmail = normalizeEmail(DEMO_OWNER_EMAIL);
  const user = await client.user.upsert({
    where: {
      email: ownerEmail
    },
    create: {
      email: ownerEmail,
      displayName: DEMO_OWNER_DISPLAY_NAME
    },
    update: {}
  });

  const existingCredential = await client.passwordCredential.findUnique({
    where: {
      userId: user.id
    }
  });

  if (existingCredential === null) {
    await client.passwordCredential.create({
      data: {
        userId: user.id,
        passwordHash: await hashSeedPassword(options.ownerPassword)
      }
    });
  }

  const organization = await client.organization.upsert({
    where: {
      slug: DEMO_ORGANIZATION_SLUG
    },
    create: {
      name: DEMO_ORGANIZATION_NAME,
      slug: DEMO_ORGANIZATION_SLUG
    },
    update: {
      name: DEMO_ORGANIZATION_NAME,
      deletedAt: null
    }
  });

  await client.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id
      }
    },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER"
    },
    update: {
      role: "OWNER"
    }
  });

  await createAuditLogIfMissing(client, {
    organizationId: organization.id,
    actorUserId: user.id,
    action: "organization.created",
    entityType: "Organization",
    entityId: organization.id,
    metadata: {
      seed: "development"
    }
  });

  const project = await client.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: DEMO_PROJECT_SLUG
      }
    },
    create: {
      organizationId: organization.id,
      name: DEMO_PROJECT_NAME,
      slug: DEMO_PROJECT_SLUG,
      status: "DRAFT"
    },
    update: {
      name: DEMO_PROJECT_NAME,
      status: "DRAFT",
      deletedAt: null
    }
  });

  await createAuditLogIfMissing(client, {
    organizationId: organization.id,
    actorUserId: user.id,
    action: "project.created",
    entityType: "Project",
    entityId: project.id,
    metadata: {
      seed: "development"
    }
  });

  await client.projectPublicationSettings.upsert({
    where: {
      projectId: project.id
    },
    create: {
      organizationId: organization.id,
      projectId: project.id,
      publicHandle: DEMO_PROJECT_SLUG
    },
    update: {}
  });

  await seedDemoPages(client, {
    organizationId: organization.id,
    projectId: project.id
  });
  await seedDemoProducts(client, {
    organizationId: organization.id,
    projectId: project.id,
    userId: user.id
  });
  await seedDemoOrders(client, {
    organizationId: organization.id,
    projectId: project.id
  });
}

async function createAuditLogIfMissing(
  client: DatabasePrismaClient,
  input: {
    readonly organizationId: string;
    readonly actorUserId: string;
    readonly action: string;
    readonly entityType: string;
    readonly entityId: string;
    readonly metadata: {
      readonly seed: "development";
    };
  }
): Promise<void> {
  const existingAuditLog = await client.auditLog.findFirst({
    where: {
      organizationId: input.organizationId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId
    }
  });

  if (existingAuditLog !== null) {
    return;
  }

  await client.auditLog.create({
    data: input
  });
}

async function seedDemoPages(
  client: DatabasePrismaClient,
  input: {
    readonly organizationId: string;
    readonly projectId: string;
  }
): Promise<void> {
  await client.$transaction(async (transaction) => {
    const existingHomePage = await transaction.sitePage.findFirst({
      where: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        deletedAt: null,
        isHome: true
      }
    });

    for (const page of DEMO_PAGES) {
      const shouldAssignHome = existingHomePage === null && page.isHome;

      await transaction.sitePage.upsert({
        where: {
          projectId_slug: {
            projectId: input.projectId,
            slug: page.slug
          }
        },
        create: {
          organizationId: input.organizationId,
          projectId: input.projectId,
          title: page.title,
          slug: page.slug,
          status: "DRAFT",
          isHome: shouldAssignHome
        },
        update: {
          title: page.title,
          status: "DRAFT",
          deletedAt: null
        }
      });

      const sitePage = await transaction.sitePage.findUniqueOrThrow({
        where: {
          projectId_slug: {
            projectId: input.projectId,
            slug: page.slug
          }
        }
      });
      const existingDocument = await transaction.pageDocument.findUnique({
        where: {
          pageId: sitePage.id
        }
      });

      if (existingDocument === null) {
        const document = createSeedPageDocument(page.slug);

        await transaction.pageDocument.create({
          data: {
            organizationId: input.organizationId,
            projectId: input.projectId,
            pageId: sitePage.id,
            schemaVersion: document.schemaVersion,
            document: toPrismaJson(document),
            revision: 1
          }
        });
      }
    }
  });
}

async function seedDemoProducts(
  client: DatabasePrismaClient,
  input: {
    readonly organizationId: string;
    readonly projectId: string;
    readonly userId: string;
  }
): Promise<void> {
  const products = [
    {
      title: "Демо футболка",
      slug: "demo-tshirt",
      shortDescription: "Базовый товар для проверки каталога.",
      sku: "DEMO-TSHIRT",
      priceMinor: 249000,
      stockQuantity: 12
    },
    {
      title: "Демо худи",
      slug: "demo-hoodie",
      shortDescription: "Товар с локальным остатком и ценой в RUB.",
      sku: "DEMO-HOODIE",
      priceMinor: 499000,
      stockQuantity: 6
    }
  ] as const;

  for (const productInput of products) {
    const product = await client.product.upsert({
      where: {
        projectId_slug: {
          projectId: input.projectId,
          slug: productInput.slug
        }
      },
      create: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        title: productInput.title,
        slug: productInput.slug,
        shortDescription: productInput.shortDescription,
        status: "ACTIVE",
        createdByUserId: input.userId,
        updatedByUserId: input.userId
      },
      update: {
        title: productInput.title,
        shortDescription: productInput.shortDescription,
        status: "ACTIVE",
        deletedAt: null,
        updatedByUserId: input.userId
      }
    });

    await client.productVariant.upsert({
      where: {
        projectId_sku: {
          projectId: input.projectId,
          sku: productInput.sku
        }
      },
      create: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        productId: product.id,
        title: "Основной вариант",
        sku: productInput.sku,
        priceMinor: productInput.priceMinor,
        stockQuantity: productInput.stockQuantity,
        trackInventory: true,
        allowBackorder: false,
        isDefault: true,
        position: 0
      },
      update: {
        productId: product.id,
        title: "Основной вариант",
        priceMinor: productInput.priceMinor,
        stockQuantity: productInput.stockQuantity,
        trackInventory: true,
        allowBackorder: false,
        isDefault: true,
        deletedAt: null
      }
    });
  }
}

async function seedDemoOrders(
  client: DatabasePrismaClient,
  input: {
    readonly organizationId: string;
    readonly projectId: string;
  }
): Promise<void> {
  const variants = await client.productVariant.findMany({
    where: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      deletedAt: null,
      product: {
        deletedAt: null
      }
    },
    include: {
      product: true
    },
    orderBy: {
      sku: "asc"
    }
  });

  const firstVariant = variants[0];

  if (firstVariant === undefined) {
    return;
  }

  const secondVariant = variants[1] ?? firstVariant;
  const demoOrders = [
    {
      orderNumber: 1001,
      status: "NEW" as const,
      customerName: "Анна Иванова",
      customerEmail: "anna@example.com",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      publicTokenHash: "seed-public-token-hash-1001",
      items: [
        {
          variant: firstVariant,
          quantity: 1
        }
      ]
    },
    {
      orderNumber: 1002,
      status: "CONFIRMED" as const,
      customerName: "Илья Петров",
      customerEmail: "ilya@example.com",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
      publicTokenHash: "seed-public-token-hash-1002",
      items: [
        {
          variant: secondVariant,
          quantity: 2
        }
      ]
    }
  ] as const;

  await client.projectOrderCounter.upsert({
    where: {
      projectId: input.projectId
    },
    create: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      lastOrderNumber: 1002
    },
    update: {}
  });

  for (const demoOrder of demoOrders) {
    const subtotalMinor = demoOrder.items.reduce(
      (sum, item) => sum + item.variant.priceMinor * item.quantity,
      0
    );

    await client.order.upsert({
      where: {
        projectId_idempotencyKey: {
          projectId: input.projectId,
          idempotencyKey: demoOrder.idempotencyKey
        }
      },
      create: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        orderNumber: demoOrder.orderNumber,
        status: demoOrder.status,
        currency: "RUB",
        subtotalMinor,
        totalMinor: subtotalMinor,
        customerName: demoOrder.customerName,
        customerEmail: demoOrder.customerEmail,
        idempotencyKey: demoOrder.idempotencyKey,
        idempotencyPayloadHash: `seed-payload-${demoOrder.orderNumber}`,
        publicHandleSnapshot: DEMO_PROJECT_SLUG,
        publicTokenHash: demoOrder.publicTokenHash,
        items: {
          create: demoOrder.items.map((item) => ({
            organizationId: input.organizationId,
            projectId: input.projectId,
            productId: item.variant.productId,
            variantId: item.variant.id,
            productNameSnapshot: item.variant.product.title,
            variantNameSnapshot: item.variant.title,
            skuSnapshot: item.variant.sku,
            unitPriceMinor: item.variant.priceMinor,
            quantity: item.quantity,
            lineTotalMinor: item.variant.priceMinor * item.quantity,
            currency: "RUB",
            inventoryDecremented: false
          }))
        }
      },
      update: {}
    });
  }
}

function createSeedPageDocument(slug: string): PageDocumentV2 {
  switch (slug) {
    case "home":
      return {
        schemaVersion: 2,
        root: {
          id: "root",
          type: "page",
          children: [
            {
              id: "seed-home-hero",
              type: "section",
              name: "Первый экран",
              isHidden: false,
              props: {
                background: "accent",
                paddingY: "large",
                contentWidth: "wide",
                layout: "two-columns",
                columnRatio: "60-40",
                verticalAlign: "center"
              },
              children: [
                {
                  id: "seed-home-hero-copy",
                  type: "column",
                  props: {
                    align: "left"
                  },
                  children: [
                    {
                      id: "seed-home-heading",
                      type: "heading",
                      props: {
                        text: "Добро пожаловать",
                        level: 1,
                        align: "left"
                      }
                    },
                    {
                      id: "seed-home-text",
                      type: "text",
                      props: {
                        text: "Это первая страница вашего сайта",
                        align: "left"
                      }
                    },
                    {
                      id: "seed-home-button",
                      type: "button",
                      props: {
                        label: "Перейти в каталог",
                        href: "/catalog",
                        align: "left",
                        variant: "primary"
                      }
                    }
                  ]
                },
                {
                  id: "seed-home-hero-media",
                  type: "column",
                  props: {
                    align: "center"
                  },
                  children: [
                    {
                      id: "seed-home-image",
                      type: "image",
                      props: {
                        src: "",
                        alt: "",
                        caption: "",
                        aspectRatio: "wide",
                        objectFit: "cover",
                        borderRadius: "large",
                        align: "center",
                        width: "full"
                      }
                    }
                  ]
                }
              ],
              metadata: {
                preset: "image-text"
              }
            }
          ]
        }
      };
    case "catalog":
      return createCatalogSeedDocument();
    case "about":
      return createTextSeedDocument({
        sectionId: "seed-about-section",
        headingId: "seed-about-heading",
        textId: "seed-about-text",
        heading: "О бренде",
        text: "Расскажите историю вашего бренда"
      });
    default:
      return {
        schemaVersion: 2,
        root: {
          id: "root",
          type: "page",
          children: []
        }
      };
  }
}

function createCatalogSeedDocument(): PageDocumentV2 {
  return {
    schemaVersion: 2,
    root: {
      id: "root",
      type: "page",
      children: [
        {
          id: "seed-catalog-section",
          type: "section",
          name: "Каталог",
          isHidden: false,
          props: {
            background: "white",
            paddingY: "medium",
            contentWidth: "wide",
            layout: "single",
            columnRatio: "50-50",
            verticalAlign: "start"
          },
          children: [
            {
              id: "seed-catalog-heading",
              type: "heading",
              props: {
                text: "Каталог",
                level: 1,
                align: "left"
              }
            },
            {
              id: "seed-catalog-grid",
              type: "product-grid",
              props: {
                selection: "all-active",
                productIds: [],
                columns: 3,
                showDescription: true,
                showPrice: true,
                buttonLabel: "Подробнее",
                limit: 8
              }
            }
          ],
          metadata: {
            preset: "product"
          }
        }
      ]
    }
  };
}

function createTextSeedDocument(input: {
  readonly sectionId: string;
  readonly headingId: string;
  readonly textId: string;
  readonly heading: string;
  readonly text: string;
}): PageDocumentV2 {
  return {
    schemaVersion: 2,
    root: {
      id: "root",
      type: "page",
      children: [
        {
          id: input.sectionId,
          type: "section",
          name: input.heading,
          isHidden: false,
          props: {
            background: "white",
            paddingY: "medium",
            contentWidth: "standard",
            layout: "single",
            columnRatio: "50-50",
            verticalAlign: "start"
          },
          children: [
            {
              id: input.headingId,
              type: "heading",
              props: {
                text: input.heading,
                level: 1,
                align: "left"
              }
            },
            {
              id: input.textId,
              type: "text",
              props: {
                text: input.text,
                align: "left"
              }
            }
          ],
          metadata: {
            preset: "text"
          }
        }
      ]
    }
  };
}

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.nodeEnv === "production") {
    throw new Error("Development seed must not run in production.");
  }

  const client = createPrismaClient(config);

  try {
    await seedDevelopmentDatabase(client, {
      ownerPassword: config.development.seedUserPassword ?? "development123"
    });
  } finally {
    await disconnectPrismaClient(client);
  }
}

void main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Development seed failed.");
  }

  process.exitCode = 1;
});

function hashSeedPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 1
  });
}
