import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException
} from "@nestjs/common";
import {
  DATABASE_CONNECTION_CHECKER,
  type DatabaseConnectionChecker
} from "./database-health.provider";

export type HealthResponse = {
  readonly status: "ok";
  readonly service: "api";
};

export type DatabaseHealthResponse = {
  readonly status: "ok";
  readonly database: "connected";
};

export const DATABASE_HEALTH_ERROR_CODE = "DATABASE_CONNECTION_UNAVAILABLE";

@Controller()
export class HealthController {
  constructor(
    @Inject(DATABASE_CONNECTION_CHECKER)
    private readonly databaseConnectionChecker: DatabaseConnectionChecker
  ) {}

  @Get("health")
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "api"
    };
  }

  @Get("health/database")
  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    const result = await this.databaseConnectionChecker();

    if (!result.ok) {
      throw new ServiceUnavailableException({
        code: DATABASE_HEALTH_ERROR_CODE,
        message: "Database connection is unavailable"
      });
    }

    return {
      status: "ok",
      database: "connected"
    };
  }
}
