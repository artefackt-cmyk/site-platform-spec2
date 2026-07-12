import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

export function createApiCorsOptions(allowedOrigins: readonly string[]): CorsOptions {
  const allowedOriginSet = new Set(allowedOrigins);

  return {
    origin: (origin, callback) => {
      if (origin === undefined || allowedOriginSet.has(origin)) {
        callback(null, true);

        return;
      }

      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  };
}
