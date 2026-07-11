import { type Provider } from "@nestjs/common";
import {
  getPrismaClient,
  type DatabasePrismaClient
} from "@site-platform/database";
import { type AppConfig } from "@site-platform/config";
import { APP_CONFIG } from "./app-config.provider";

export const DATABASE_CLIENT = Symbol("DATABASE_CLIENT");

export const databaseClientProvider: Provider<DatabasePrismaClient> = {
  provide: DATABASE_CLIENT,
  inject: [APP_CONFIG],
  useFactory: (config: AppConfig) => getPrismaClient(config)
};
