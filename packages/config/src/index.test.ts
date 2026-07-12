import { describe, expect, it } from "vitest";
import { loadConfig, loadConfigSafe, loadPublicConfig } from "./index";

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
        DEV_USER_EMAIL: "Owner@Example.COM",
        DASHBOARD_ORIGIN: "http://localhost:3000",
        STOREFRONT_ORIGIN: "http://localhost:3001",
        NEXT_PUBLIC_API_URL: "http://localhost:3002",
        NEXT_PUBLIC_STOREFRONT_URL: "http://localhost:3001",
        NEXT_PUBLIC_DASHBOARD_URL: "http://localhost:3000",
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
      web: {
        dashboardOrigin: "http://localhost:3000",
        storefrontOrigin: "http://localhost:3001",
        publicApiUrl: "http://localhost:3002",
        publicStorefrontUrl: "http://localhost:3001"
      },
      media: {
        storageDir: ".local-media",
        publicBaseUrl: "http://localhost:3002"
      },
      development: {
        devUserEmail: "Owner@Example.COM"
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

  it("rejects development identity configuration in production", () => {
    const result = loadConfigSafe({
      dotenvPath: false,
      env: {
        NODE_ENV: "production",
        DATABASE_URL: developmentDatabaseUrl,
        DEV_USER_EMAIL: "owner@example.com"
      }
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.issues).toContainEqual({
        variable: "DEV_USER_EMAIL",
        message:
          "DEV_USER_EMAIL is development-only and must not be set in production",
        secret: false
      });
    }
  });

  it("loads public dashboard configuration without database variables", () => {
    const publicConfig = loadPublicConfig({
      dotenvPath: false,
      env: {
        NEXT_PUBLIC_API_URL: "http://localhost:3002",
        NEXT_PUBLIC_STOREFRONT_URL: "http://localhost:3001",
        NEXT_PUBLIC_DASHBOARD_URL: "http://localhost:3000"
      }
    });

    expect(publicConfig).toEqual({
      apiUrl: "http://localhost:3002",
      storefrontUrl: "http://localhost:3001",
      dashboardUrl: "http://localhost:3000"
    });
  });
});
