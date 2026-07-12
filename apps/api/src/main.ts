import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadConfig } from "@site-platform/config";
import { AppModule } from "./app.module";
import { createApiCorsOptions } from "./cors-options";
import { createCsrfOriginMiddleware } from "./csrf-origin";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors(
    createApiCorsOptions([
      config.web.dashboardOrigin,
      config.web.storefrontOrigin
    ])
  );
  app.use(createCsrfOriginMiddleware(config));
  await app.listen(config.ports.api);
}

void bootstrap();
