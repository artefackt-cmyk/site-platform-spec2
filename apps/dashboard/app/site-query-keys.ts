export type SiteQueryKey = readonly string[];

export const SITE_QUERY_KEYS = {
  project: (projectId: string) => ["project", projectId] as const,
  projectSites: (projectId: string) => ["project", projectId, "sites"] as const,
  site: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId] as const,
  sitePages: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId, "pages"] as const,
  siteSettings: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId, "settings"] as const,
  sitePublicationSettings: (projectId: string, siteId: string) =>
    ["project", projectId, "site", siteId, "publication-settings"] as const,
  sitePublicationStatus: (projectId: string, siteId: string, pageId: string) =>
    [
      "project",
      projectId,
      "site",
      siteId,
      "page",
      pageId,
      "publication-status"
    ] as const
};

export const SITE_QUERY_INVALIDATIONS = {
  createSite: (projectId: string) =>
    [
      SITE_QUERY_KEYS.project(projectId),
      SITE_QUERY_KEYS.projectSites(projectId)
    ] satisfies readonly SiteQueryKey[],
  updateSite: (projectId: string, siteId: string) =>
    [
      SITE_QUERY_KEYS.projectSites(projectId),
      SITE_QUERY_KEYS.site(projectId, siteId)
    ] satisfies readonly SiteQueryKey[],
  archiveSite: (projectId: string, siteId: string) =>
    [
      SITE_QUERY_KEYS.projectSites(projectId),
      SITE_QUERY_KEYS.site(projectId, siteId),
      SITE_QUERY_KEYS.sitePages(projectId, siteId),
      SITE_QUERY_KEYS.siteSettings(projectId, siteId),
      SITE_QUERY_KEYS.sitePublicationSettings(projectId, siteId)
    ] satisfies readonly SiteQueryKey[],
  setDefaultSite: (projectId: string, siteId: string) =>
    [
      SITE_QUERY_KEYS.projectSites(projectId),
      SITE_QUERY_KEYS.site(projectId, siteId)
    ] satisfies readonly SiteQueryKey[],
  createSitePage: (projectId: string, siteId: string) =>
    [SITE_QUERY_KEYS.sitePages(projectId, siteId)] satisfies readonly SiteQueryKey[],
  updateSiteSettings: (projectId: string, siteId: string) =>
    [SITE_QUERY_KEYS.siteSettings(projectId, siteId)] satisfies readonly SiteQueryKey[],
  updateSitePublicationSettings: (projectId: string, siteId: string) =>
    [
      SITE_QUERY_KEYS.sitePublicationSettings(projectId, siteId)
    ] satisfies readonly SiteQueryKey[],
  publishSitePage: (projectId: string, siteId: string, pageId: string) =>
    [
      SITE_QUERY_KEYS.sitePages(projectId, siteId),
      SITE_QUERY_KEYS.sitePublicationStatus(projectId, siteId, pageId)
    ] satisfies readonly SiteQueryKey[]
};
