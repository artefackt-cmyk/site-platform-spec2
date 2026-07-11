import { Module } from "@nestjs/common";
import { databaseConnectionCheckerProvider } from "./database-health.provider";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
  providers: [databaseConnectionCheckerProvider]
})
export class AppModule {}
