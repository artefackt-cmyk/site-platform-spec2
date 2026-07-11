import { loadConfig } from "@site-platform/config";
import { normalizeEmail } from "@site-platform/domain";
import {
  createPrismaClient,
  disconnectPrismaClient,
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
  client: DatabasePrismaClient
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

  await seedDemoPages(client, {
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
    await transaction.sitePage.updateMany({
      where: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        deletedAt: null
      },
      data: {
        isHome: false
      }
    });

    for (const page of DEMO_PAGES) {
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
          isHome: page.isHome
        },
        update: {
          title: page.title,
          status: "DRAFT",
          isHome: page.isHome,
          deletedAt: null
        }
      });
    }
  });
}

async function main(): Promise<void> {
  const config = loadConfig();

  if (config.nodeEnv === "production") {
    throw new Error("Development seed must not run in production.");
  }

  const client = createPrismaClient(config);

  try {
    await seedDevelopmentDatabase(client);
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
