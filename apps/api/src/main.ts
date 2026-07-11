import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadConfig } from "@site-platform/config";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: config.web.dashboardOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false
  });
  await app.listen(config.ports.api);
}

void bootstrap();
