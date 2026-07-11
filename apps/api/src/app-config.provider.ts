import { type Provider } from "@nestjs/common";
import { loadConfig, type AppConfig } from "@site-platform/config";

export const APP_CONFIG = Symbol("APP_CONFIG");

export const appConfigProvider: Provider<AppConfig> = {
  provide: APP_CONFIG,
  useFactory: loadConfig
};
