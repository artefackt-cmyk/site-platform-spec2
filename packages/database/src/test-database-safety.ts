import type { AppConfig } from "@site-platform/config";

export type TestDatabaseSafetyErrorCode =
  | "NODE_ENV_NOT_TEST"
  | "ACTIVE_DATABASE_URL_NOT_TEST"
  | "DEVELOPMENT_DATABASE_URL_MISSING"
  | "TEST_DATABASE_URL_MATCHES_DEVELOPMENT"
  | "TEST_DATABASE_URL_NOT_RECOGNIZED";

export class TestDatabaseSafetyError extends Error {
  readonly code: TestDatabaseSafetyErrorCode;

  constructor(code: TestDatabaseSafetyErrorCode, message: string) {
    super(message);
    this.name = "TestDatabaseSafetyError";
    this.code = code;
  }
}

export function assertSafeTestDatabaseConfig(config: AppConfig): void {
  if (config.nodeEnv !== "test") {
    throw new TestDatabaseSafetyError(
      "NODE_ENV_NOT_TEST",
      "Refusing to use test database command when NODE_ENV is not test"
    );
  }

  if (config.database.activeUrlKind !== "test") {
    throw new TestDatabaseSafetyError(
      "ACTIVE_DATABASE_URL_NOT_TEST",
      "Refusing to use test database command without active test database URL"
    );
  }

  if (config.database.developmentUrl === undefined) {
    throw new TestDatabaseSafetyError(
      "DEVELOPMENT_DATABASE_URL_MISSING",
      "DATABASE_URL must be set so test database safety can compare URLs"
    );
  }

  if (config.database.url === config.database.developmentUrl) {
    throw new TestDatabaseSafetyError(
      "TEST_DATABASE_URL_MATCHES_DEVELOPMENT",
      "Refusing to use test database command because test and development URLs match"
    );
  }

  if (!isRecognizedTestDatabaseUrl(config.database.url)) {
    throw new TestDatabaseSafetyError(
      "TEST_DATABASE_URL_NOT_RECOGNIZED",
      "Refusing to use database URL that is not recognized as a test database"
    );
  }
}

export function isRecognizedTestDatabaseUrl(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    const databaseName = parsed.pathname.replace(/^\//, "");

    return /test/i.test(databaseName) && !/(prod|production)/i.test(databaseName);
  } catch {
    return false;
  }
}

