import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardApiClient } from "./dashboard-api-client";

describe("DashboardApiClient site management", () => {
  const fetchMock = vi.fn();
  const client = createDashboardApiClient("https://api.example.test/");

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("creates a Site with the expected payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      site: siteResponse("site-new", "New Site", "new-site", false, "ACTIVE")
    }));

    await expect(
      client.createProjectSite("project-1", {
        name: "New Site",
        slug: "new-site"
      })
    ).resolves.toMatchObject({
      site: {
        id: "site-new",
        name: "New Site",
        slug: "new-site"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/projects/project-1/sites",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          name: "New Site",
          slug: "new-site"
        })
      })
    );
  });

  it("surfaces duplicate slug from backend validation", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, {
      code: "SITE_SLUG_ALREADY_EXISTS",
      message: "Site slug already exists inside this project."
    }));

    await expect(
      client.createProjectSite("project-1", {
        name: "Main",
        slug: "main"
      })
    ).rejects.toMatchObject({
      status: 409,
      code: "SITE_SLUG_ALREADY_EXISTS"
    });
  });

  it("updates Site name and slug", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      site: siteResponse("site-1", "Renamed Site", "renamed-site", true, "ACTIVE")
    }));

    await client.updateProjectSite("project-1", "site-1", {
      name: "Renamed Site",
      slug: "renamed-site"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/projects/project-1/sites/site-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({
          name: "Renamed Site",
          slug: "renamed-site"
        })
      })
    );
  });

  it("sets the default Site through the existing endpoint", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      site: siteResponse("site-2", "Second Site", "second-site", true, "ACTIVE")
    }));

    await client.setDefaultProjectSite("project-1", "site-2");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/projects/project-1/sites/site-2/set-default",
      expect.objectContaining({
        method: "POST",
        credentials: "include"
      })
    );
  });

  it("archives a Site through DELETE as soft archive", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      site: siteResponse("site-2", "Second Site", "second-site", false, "ARCHIVED")
    }));

    await expect(
      client.archiveProjectSite("project-1", "site-2")
    ).resolves.toMatchObject({
      site: {
        id: "site-2",
        status: "ARCHIVED"
      }
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/projects/project-1/sites/site-2",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include"
      })
    );
  });

  it("surfaces 403 permission errors for UI handling", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, {
      code: "PERMISSION_DENIED",
      message: "Current user does not have permission to archive sites."
    }));

    await expect(
      client.archiveProjectSite("project-1", "site-2")
    ).rejects.toMatchObject({
      status: 403,
      code: "PERMISSION_DENIED"
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

function siteResponse(
  id: string,
  name: string,
  slug: string,
  isDefault: boolean,
  status: "ACTIVE" | "ARCHIVED"
) {
  return {
    id,
    projectId: "project-1",
    name,
    slug,
    status,
    isDefault,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z"
  };
}
