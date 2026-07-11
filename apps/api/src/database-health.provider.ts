import { type Provider } from "@nestjs/common";
import {
  checkDatabaseConnection,
  type DatabaseConnectionResult
} from "@site-platform/database";

export type DatabaseConnectionChecker = () => Promise<DatabaseConnectionResult>;

export const DATABASE_CONNECTION_CHECKER = Symbol("DATABASE_CONNECTION_CHECKER");

export const databaseConnectionCheckerProvider: Provider = {
  provide: DATABASE_CONNECTION_CHECKER,
  useValue: checkDatabaseConnection
};

