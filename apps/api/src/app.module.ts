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
import { OrderController, PublicOrderController } from "./order.controller";
import { OrderService } from "./order.service";
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
import { SiteSettingsController } from "./site-settings.controller";
import { SiteSettingsService } from "./site-settings.service";

@Module({
  controllers: [
    HealthController,
    AuthController,
    MeController,
    ProjectsController,
    SiteSettingsController,
    MediaController,
    PublicationController,
    PublicSiteController,
    ProductController,
    PublicProductController,
    OrderController,
    PublicOrderController
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
    SiteSettingsService,
    MediaService,
    PublicationService,
    PublicSiteService,
    ProductService,
    PublicCatalogService,
    OrderService,
    AuthService
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestContextMiddleware).forRoutes("*");
  }
}
