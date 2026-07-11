import { Module } from "@nestjs/common";
import { appConfigProvider } from "./app-config.provider";
import { databaseConnectionCheckerProvider } from "./database-health.provider";
import { databaseClientProvider } from "./database.provider";
import {
  CURRENT_IDENTITY_RESOLVER,
  DevelopmentIdentityService
} from "./current-identity";
import { HealthController } from "./health.controller";
import { MeController } from "./me.controller";
import { PROJECT_STORE, PrismaProjectStore } from "./project-store";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  controllers: [HealthController, MeController, ProjectsController],
  providers: [
    appConfigProvider,
    databaseClientProvider,
    databaseConnectionCheckerProvider,
    DevelopmentIdentityService,
    {
      provide: CURRENT_IDENTITY_RESOLVER,
      useExisting: DevelopmentIdentityService
    },
    PrismaProjectStore,
    {
      provide: PROJECT_STORE,
      useExisting: PrismaProjectStore
    },
    ProjectsService
  ]
})
export class AppModule {}
