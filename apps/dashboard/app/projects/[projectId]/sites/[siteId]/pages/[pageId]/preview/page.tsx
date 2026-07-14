import { loadPublicConfig } from "@site-platform/config";
import { PagePreviewApp } from "../../../../../../../page-preview-app";

type SitePagePreviewRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly siteId: string;
    readonly pageId: string;
  }>;
};

export default async function Page({ params }: SitePagePreviewRouteProps) {
  const config = loadPublicConfig();
  const { projectId, siteId, pageId } = await params;

  return (
    <PagePreviewApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      siteId={siteId}
      pageId={pageId}
    />
  );
}

