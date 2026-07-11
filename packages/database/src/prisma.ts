import { createRequire } from "node:module";
import { loadConfig, type AppConfig } from "@site-platform/config";
import type { DatabasePrismaClient } from "./types";

export type PrismaClientLike = DatabasePrismaClient;

type PrismaClientConstructor = new (options: {
  readonly datasources: {
    readonly db: {
      readonly url: string;
    };
  };
}) => PrismaClientLike;

type PrismaClientModule = {
  readonly PrismaClient?: PrismaClientConstructor;
};

export type DatabaseConnectionResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly code: "DATABASE_CONNECTION_FAILED";
    };

type CachedPrismaClient = {
  readonly url: string;
  readonly client: DatabasePrismaClient;
};

type GlobalWithPrisma = typeof globalThis & {
  __sitePlatformPrisma?: CachedPrismaClient;
};

const globalWithPrisma = globalThis as GlobalWithPrisma;
const requireFromCurrentFile = createRequire(__filename);

export function createPrismaClient(
  config: AppConfig = loadConfig()
): DatabasePrismaClient {
  const PrismaClient = getPrismaClientConstructor();

  return new PrismaClient({
    datasources: {
      db: {
        url: config.database.url
      }
    }
  });
}

export function getPrismaClient(
  config: AppConfig = loadConfig()
): DatabasePrismaClient {
  if (config.nodeEnv !== "development") {
    return createPrismaClient(config);
  }

  const cached = globalWithPrisma.__sitePlatformPrisma;

  if (cached !== undefined && cached.url === config.database.url) {
    return cached.client;
  }

  const client = createPrismaClient(config);
  globalWithPrisma.__sitePlatformPrisma = {
    url: config.database.url,
    client
  };

  return client;
}

export async function disconnectPrismaClient(
  client?: DatabasePrismaClient
): Promise<void> {
  if (client !== undefined) {
    await client.$disconnect();
    return;
  }

  const cached = globalWithPrisma.__sitePlatformPrisma;

  if (cached !== undefined) {
    await cached.client.$disconnect();
    delete globalWithPrisma.__sitePlatformPrisma;
  }
}

export async function checkDatabaseConnection(
  client: DatabasePrismaClient = getPrismaClient()
): Promise<DatabaseConnectionResult> {
  try {
    await client.$queryRaw`SELECT 1`;

    return {
      ok: true
    };
  } catch {
    return {
      ok: false,
      code: "DATABASE_CONNECTION_FAILED"
    };
  }
}

function getPrismaClientConstructor(): PrismaClientConstructor {
  const prismaModule = requireFromCurrentFile("@prisma/client") as PrismaClientModule;

  if (prismaModule.PrismaClient === undefined) {
    throw new Error(
      "Prisma Client is not generated. Run `pnpm db:generate` before using the database package."
    );
  }

  return prismaModule.PrismaClient;
}
