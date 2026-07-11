import { describe, expect, it } from "vitest";
import { loadConfig, loadConfigSafe } from "./index";

const developmentDatabaseUrl =
  "postgresql://site_platform:local@localhost:5432/site_platform_dev?schema=public";
const testDatabaseUrl =
  "postgresql://site_platform:local@localhost:5432/site_platform_test?schema=public";

describe("loadConfig", () => {
  it("loads a valid development configuration", () => {
    const config = loadConfig({
      dotenvPath: false,
      env: {
        NODE_ENV: "development",
        DATABASE_URL: developmentDatabaseUrl,
        API_PORT: "3002",
        DASHBOARD_PORT: "3000",
        STOREFRONT_PORT: "3001"
      }
    });

    expect(config).toEqual({
      nodeEnv: "development",
      ports: {
        api: 3002,
        dashboard: 3000,
        storefront: 3001
      },
      database: {
        url: developmentDatabaseUrl,
        activeUrlKind: "development",
        developmentUrl: developmentDatabaseUrl
      }
    });
  });

  it("reports a missing required database URL without exposing secret values", () => {
    const result = loadConfigSafe({
      dotenvPath: false,
      env: {
        NODE_ENV: "production",
        TEST_DATABASE_URL: "postgresql://secret:secret@localhost:5432/hidden_test"
      }
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.issues).toEqual([
        {
          variable: "DATABASE_URL",
          message: "DATABASE_URL is required when NODE_ENV is not test",
          secret: true
        }
      ]);
      expect(result.error.message).not.toContain("secret:secret");
    }
  });

  it("reports an invalid port", () => {
    const result = loadConfigSafe({
      dotenvPath: false,
      env: {
        NODE_ENV: "development",
        DATABASE_URL: developmentDatabaseUrl,
        API_PORT: "70000"
      }
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.issues).toContainEqual({
        variable: "API_PORT",
        message: "Port must be less than or equal to 65535",
        secret: false
      });
    }
  });

  it("uses TEST_DATABASE_URL in test environment", () => {
    const config = loadConfig({
      dotenvPath: false,
      env: {
        NODE_ENV: "test",
        DATABASE_URL: developmentDatabaseUrl,
        TEST_DATABASE_URL: testDatabaseUrl
      }
    });

    expect(config.database.url).toBe(testDatabaseUrl);
    expect(config.database.activeUrlKind).toBe("test");
    expect(config.database.developmentUrl).toBe(developmentDatabaseUrl);
  });
});
