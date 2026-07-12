import { describe, expect, it, vi } from "vitest";
import type { AppConfig } from "@site-platform/config";
import { createCsrfOriginMiddleware } from "./csrf-origin";

const config = {
  web: {
    dashboardOrigin: "http://localhost:3000",
    storefrontOrigin: "http://localhost:3001"
  },
  auth: {
    appOrigin: "http://localhost:3000"
  }
} as AppConfig;

describe("createCsrfOriginMiddleware", () => {
  it("allows configured dashboard origin", () => {
    const next = vi.fn();
    const response = createResponse();
    const middleware = createCsrfOriginMiddleware(config);

    middleware(
      {
        method: "POST",
        headers: {
          origin: "http://localhost:3000"
        }
      } as never,
      response as never,
      next
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects invalid origin", () => {
    const next = vi.fn();
    const response = createResponse();
    const middleware = createCsrfOriginMiddleware(config);

    middleware(
      {
        method: "POST",
        headers: {
          origin: "https://evil.example"
        }
      } as never,
      response as never,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
  });
});

function createResponse() {
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(() => response)
  };

  return response;
}
