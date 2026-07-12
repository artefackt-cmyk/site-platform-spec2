import { Module } from "@nestjs/common";
import { appConfigProvider } from "./app-config.provider";
import { databaseConnectionCheckerProvider } from "./database-health.provider";
import { databaseClientProvider } from "./database.provider";
import {
  CURRENT_IDENTITY_RESOLVER,
  DevelopmentIdentityService
} from "./current-identity";
import { HealthController } from "./health.controller";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { MeController } from "./me.controller";
import {
  PublicationController,
  PublicSiteController
} from "./publication.controller";
import { PublicationService, PublicSiteService } from "./publication.service";
import {
  ProductController,
  PublicProductController
} from "./product.controller";
import { ProductService, PublicCatalogService } from "./product.service";
import { PROJECT_STORE, PrismaProjectStore } from "./project-store";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  controllers: [
    HealthController,
    MeController,
    ProjectsController,
    MediaController,
    PublicationController,
    PublicSiteController,
    ProductController,
    PublicProductController
  ],
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
    ProjectsService,
    MediaService,
    PublicationService,
    PublicSiteService,
    ProductService,
    PublicCatalogService
  ]
})
export class AppModule {}
