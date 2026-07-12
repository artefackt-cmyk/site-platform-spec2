import type { Request, Response, NextFunction } from "express";
import type { AppConfig } from "@site-platform/config";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function createCsrfOriginMiddleware(config: AppConfig) {
  const allowedOrigins = new Set([
    config.web.dashboardOrigin,
    config.web.storefrontOrigin,
    config.auth.appOrigin
  ]);

  return (request: Request, response: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(request.method)) {
      next();
      return;
    }

    const origin = request.headers.origin;

    if (origin === undefined || allowedOrigins.has(origin)) {
      next();
      return;
    }

    response.status(403).json({
      code: "AUTH_CSRF_INVALID",
      message: "Request origin is not trusted."
    });
  };
}
