import { describe, expect, it } from "vitest";
import { SITE_QUERY_INVALIDATIONS, SITE_QUERY_KEYS } from "./site-query-keys";

describe("SITE_QUERY_KEYS", () => {
  it("keeps site-scoped resources under stable project/site keys", () => {
    expect(SITE_QUERY_KEYS.project("project-1")).toEqual(["project", "project-1"]);
    expect(SITE_QUERY_KEYS.projectSites("project-1")).toEqual([
      "project",
      "project-1",
      "sites"
    ]);
    expect(SITE_QUERY_KEYS.site("project-1", "site-1")).toEqual([
      "project",
      "project-1",
      "site",
      "site-1"
    ]);
    expect(SITE_QUERY_KEYS.sitePages("project-1", "site-1")).toEqual([
      "project",
      "project-1",
      "site",
      "site-1",
      "pages"
    ]);
    expect(SITE_QUERY_KEYS.siteSettings("project-1", "site-1")).toEqual([
      "project",
      "project-1",
      "site",
      "site-1",
      "settings"
    ]);
    expect(SITE_QUERY_KEYS.sitePublicationSettings("project-1", "site-1")).toEqual([
      "project",
      "project-1",
      "site",
      "site-1",
      "publication-settings"
    ]);
    expect(
      SITE_QUERY_KEYS.sitePublicationStatus("project-1", "site-1", "page-1")
    ).toEqual([
      "project",
      "project-1",
      "site",
      "site-1",
      "page",
      "page-1",
      "publication-status"
    ]);
  });

  it("targets site mutations without broad full-page reload invalidation", () => {
    expect(SITE_QUERY_INVALIDATIONS.setDefaultSite("project-1", "site-1")).toEqual([
      SITE_QUERY_KEYS.projectSites("project-1"),
      SITE_QUERY_KEYS.site("project-1", "site-1")
    ]);
    expect(SITE_QUERY_INVALIDATIONS.archiveSite("project-1", "site-1")).toContainEqual(
      SITE_QUERY_KEYS.siteSettings("project-1", "site-1")
    );
  });
});
