import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveLegacySiteRedirect } from "./legacy-site-redirect";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    toString: (): string => "sid=test-cookie"
  }))
}));

describe("resolveLegacySiteRedirect", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("redirects legacy section routes to the active default Site", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      sites: [
        site("site-a", false, "ACTIVE"),
        site("site-b", true, "ACTIVE")
      ]
    }));

    await expect(
      resolveLegacySiteRedirect({
        apiUrl: "https://api.example.test/",
        projectId: "project-1",
        target: {
          type: "section",
          section: "settings"
        }
      })
    ).resolves.toEqual({
      status: "redirect",
      href: "/projects/project-1/sites/site-b/settings"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/projects/project-1/sites",
      {
        cache: "no-store",
        headers: {
          cookie: "sid=test-cookie"
        }
      }
    );
  });

  it("does not redirect to an archived default Site", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      sites: [site("site-archived", true, "ARCHIVED")]
    }));

    await expect(
      resolveLegacySiteRedirect({
        apiUrl: "https://api.example.test",
        projectId: "project-1",
        target: {
          type: "section",
          section: "pages"
        }
      })
    ).resolves.toEqual({
      status: "error",
      message: "Активный default Site не найден для этого проекта."
    });
  });

  it("returns an access error when the backend rejects the current user", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, {
      code: "FORBIDDEN",
      message: "Forbidden"
    }));

    await expect(
      resolveLegacySiteRedirect({
        apiUrl: "https://api.example.test",
        projectId: "project-1",
        target: {
          type: "page-editor",
          pageId: "page-1"
        }
      })
    ).resolves.toEqual({
      status: "error",
      message: "У пользователя нет доступа к Site context этого проекта."
    });
  });

  it("does not create a redirect loop for legacy page preview routes", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      sites: [site("site-a", true, "ACTIVE")]
    }));

    await expect(
      resolveLegacySiteRedirect({
        apiUrl: "https://api.example.test",
        projectId: "project-1",
        target: {
          type: "page-preview",
          pageId: "page-1"
        }
      })
    ).resolves.toEqual({
      status: "redirect",
      href: "/projects/project-1/sites/site-a/pages/page-1/preview"
    });
  });
});

function jsonResponse(status: number, payload: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}

function site(id: string, isDefault: boolean, status: "ACTIVE" | "ARCHIVED") {
  return {
    id,
    projectId: "project-1",
    name: id,
    slug: id,
    status,
    isDefault,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
}
