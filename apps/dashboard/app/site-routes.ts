export const SITE_SECTIONS = ["overview", "pages", "settings", "publication"] as const;

export type SiteSection = (typeof SITE_SECTIONS)[number];

export const SITE_QUERY_KEYS = {
  project: (projectId: string) => ["project", projectId] as const,
  projectSites: (projectId: string) => ["project", projectId, "sites"] as const,
  site: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId] as const,
  sitePages: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId, "pages"] as const,
  siteSettings: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId, "settings"] as const,
  publicationSettings: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId, "publication-settings"] as const,
  publicationStatus: (projectId: string, siteId: string, pageId: string) =>
    ["project", projectId, "site", siteId, "page", pageId, "publication-status"] as const
};

export function createProjectSitesRoute(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/sites`;
}

export function createSiteRoute(
  projectId: string,
  siteId: string,
  section: SiteSection = "overview"
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/sites/${encodeURIComponent(
    siteId
  )}`;

  switch (section) {
    case "overview":
      return base;
    case "pages":
      return `${base}/pages`;
    case "settings":
      return `${base}/settings`;
    case "publication":
      return `${base}/publication`;
  }
}

export function createSitePageEditorRoute(
  projectId: string,
  siteId: string,
  pageId: string
): string {
  return `${createSiteRoute(projectId, siteId, "pages")}/${encodeURIComponent(
    pageId
  )}`;
}

export function createSitePagePreviewRoute(
  projectId: string,
  siteId: string,
  pageId: string
): string {
  return `${createSitePageEditorRoute(projectId, siteId, pageId)}/preview`;
}

