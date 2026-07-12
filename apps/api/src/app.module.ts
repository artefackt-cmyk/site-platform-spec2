import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_CONFIG, appConfigProvider } from "./app-config.provider";
import { databaseConnectionCheckerProvider } from "./database-health.provider";
import { databaseClientProvider } from "./database.provider";
import {
  CURRENT_IDENTITY_RESOLVER,
  RequestIdentityService,
  requestContextMiddleware
} from "./current-identity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { EMAIL_SENDER, createEmailSender } from "./email-sender";
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
    AuthController,
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
    RequestIdentityService,
    {
      provide: CURRENT_IDENTITY_RESOLVER,
      useExisting: RequestIdentityService
    },
    {
      provide: EMAIL_SENDER,
      useFactory: createEmailSender,
      inject: [APP_CONFIG]
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
    PublicCatalogService,
    AuthService
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestContextMiddleware).forRoutes("*");
  }
}
