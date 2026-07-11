import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadConfig } from "@site-platform/config";
import { AppModule } from "./app.module";
import { createApiCorsOptions } from "./cors-options";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors(createApiCorsOptions(config.web.dashboardOrigin));
  await app.listen(config.ports.api);
}

void bootstrap();
