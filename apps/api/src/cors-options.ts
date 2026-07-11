import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export function createApiCorsOptions(dashboardOrigin: string): CorsOptions {
  return {
    origin: dashboardOrigin,
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: false
  };
}
