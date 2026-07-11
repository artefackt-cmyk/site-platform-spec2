import "reflect-metadata";
import { RequestMethod, ServiceUnavailableException } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { describe, expect, it, vi } from "vitest";
import {
  DATABASE_HEALTH_ERROR_CODE,
  HealthController
} from "./health.controller";

describe("GET /health", () => {
  it("declares the health route and returns the API health response", () => {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, HealthController);
    const routePath = Reflect.getMetadata(
      PATH_METADATA,
      HealthController.prototype.getHealth
    );
    const requestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      HealthController.prototype.getHealth
    );

    expect(controllerPath).toBe("/");
    expect(routePath).toBe("health");
    expect(requestMethod).toBe(RequestMethod.GET);
    expect(new HealthController(async () => ({ ok: true })).getHealth()).toEqual({
      status: "ok",
      service: "api"
    });
  });
});

describe("GET /health/database", () => {
  it("declares the database health route and returns the database health response", async () => {
    const routePath = Reflect.getMetadata(
      PATH_METADATA,
      HealthController.prototype.getDatabaseHealth
    );
    const requestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      HealthController.prototype.getDatabaseHealth
    );
    const databaseConnectionChecker = vi.fn(async () => ({ ok: true }) as const);

    await expect(
      new HealthController(databaseConnectionChecker).getDatabaseHealth()
    ).resolves.toEqual({
      status: "ok",
      database: "connected"
    });
    expect(routePath).toBe("health/database");
    expect(requestMethod).toBe(RequestMethod.GET);
  });

  it("returns a stable error code without exposing connection details", async () => {
    const databaseConnectionChecker = vi.fn(
      async () =>
        ({
          ok: false,
          code: "DATABASE_CONNECTION_FAILED"
        }) as const
    );

    let caughtError: unknown;

    try {
      await new HealthController(databaseConnectionChecker).getDatabaseHealth();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ServiceUnavailableException);

    if (!(caughtError instanceof ServiceUnavailableException)) {
      throw new Error("Expected ServiceUnavailableException");
    }

    const response = caughtError.getResponse();
    expect(caughtError.getStatus()).toBe(503);
    expect(isRecord(response)).toBe(true);

    if (!isRecord(response)) {
      throw new Error("Expected object response");
    }

    expect(response).toMatchObject({
      code: DATABASE_HEALTH_ERROR_CODE,
      message: "Database connection is unavailable"
    });
    expect(JSON.stringify(response)).not.toContain("postgresql://");
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
