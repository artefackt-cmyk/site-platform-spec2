import { loadConfigSafe, type AppConfig } from "@site-platform/config";
import { describe, expect, it } from "vitest";
import {
  assertSafeTestDatabaseConfig,
  checkDatabaseConnection,
  createPrismaClient,
  disconnectPrismaClient
} from "./index";

const integrationConfig = getSafeIntegrationConfig();

describe.skipIf(integrationConfig === undefined)("PostgreSQL integration", () => {
  it("connects to the configured test database", async () => {
    expect(integrationConfig).toBeDefined();

    if (integrationConfig === undefined) {
      return;
    }

    const client = createPrismaClient(integrationConfig);

    try {
      await expect(checkDatabaseConnection(client)).resolves.toEqual({
        ok: true
      });
    } finally {
      await disconnectPrismaClient(client);
    }
  });
});

function getSafeIntegrationConfig(): AppConfig | undefined {
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
    return result.config;
  } catch {
    return undefined;
  }
}

