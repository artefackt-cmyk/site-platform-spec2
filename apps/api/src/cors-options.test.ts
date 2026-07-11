import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { createApiCorsOptions } from "./cors-options";

describe("API CORS preflight", () => {
  it("allows dashboard PUT preflight without allowing every origin", async () => {
    const moduleRef = await Test.createTestingModule({}).compile();
    const app = moduleRef.createNestApplication();

    app.enableCors(createApiCorsOptions("http://localhost:3000"));
    await app.init();

    try {
      const response = await dispatchPreflight(app);

      expect(response.getHeaderValue("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000"
      );
      expect(response.getHeaderValue("Access-Control-Allow-Origin")).not.toBe("*");
      expect(
        String(response.getHeaderValue("Access-Control-Allow-Methods"))
      ).toContain("PUT");
      expect(response.getHeaderValue("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );
    } finally {
      await app.close();
      await moduleRef.close();
    }
  });
});

type HeaderValue = number | string | readonly string[];

type ExpressLikeApplication = {
  readonly handle: (
    request: PreflightRequest,
    response: PreflightResponse,
    next: (error?: unknown) => void
  ) => void;
};

class PreflightRequest {
  readonly method = "OPTIONS";
  readonly url = "/api/projects/project-1/pages/page-1/document";
  readonly originalUrl = this.url;
  readonly headers = {
    origin: "http://localhost:3000",
    "access-control-request-method": "PUT",
    "access-control-request-headers": "Content-Type"
  };
  readonly socket = {
    encrypted: false
  };
  readonly connection = this.socket;
}

class PreflightResponse {
  statusCode = 200;
  headersSent = false;
  writableEnded = false;
  private readonly headers = new Map<string, HeaderValue>();
  private resolveEnded: (() => void) | null = null;

  readonly ended = new Promise<void>((resolve) => {
    this.resolveEnded = resolve;
  });

  readonly setHeader = (name: string, value: HeaderValue): this => {
    this.headers.set(normalizeHeaderName(name), value);

    return this;
  };

  readonly getHeader = (name: string): HeaderValue | undefined => {
    return this.headers.get(normalizeHeaderName(name));
  };

  readonly getHeaderValue = (name: string): HeaderValue | undefined => {
    return this.getHeader(name);
  };

  readonly removeHeader = (name: string): void => {
    this.headers.delete(normalizeHeaderName(name));
  };

  readonly writeHead = (
    statusCode: number,
    headers?: Record<string, HeaderValue>
  ): this => {
    this.statusCode = statusCode;

    if (headers !== undefined) {
      for (const [name, value] of Object.entries(headers)) {
        this.setHeader(name, value);
      }
    }

    return this;
  };

  readonly end = (): this => {
    this.headersSent = true;
    this.writableEnded = true;
    this.resolveEnded?.();

    return this;
  };
}

async function dispatchPreflight(
  app: INestApplication
): Promise<PreflightResponse> {
  const expressApp = app.getHttpAdapter().getInstance() as ExpressLikeApplication;
  const request = new PreflightRequest();
  const response = new PreflightResponse();
  let nextError: unknown;

  expressApp.handle(request, response, (error?: unknown) => {
    nextError = error ?? new Error("CORS preflight was not handled.");
    response.end();
  });

  await response.ended;

  if (nextError !== undefined) {
    throw nextError;
  }

  return response;
}

function normalizeHeaderName(name: string): string {
  return name.toLowerCase();
}
