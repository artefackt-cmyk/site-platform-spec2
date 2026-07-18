export const SITE_SECTIONS = ["overview", "pages", "settings", "publication"] as const;

export type SiteSection = (typeof SITE_SECTIONS)[number];

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
