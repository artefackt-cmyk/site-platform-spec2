import { loadPublicConfig } from "@site-platform/config";
import { PageEditorApp } from "../../../../../../page-editor-app";

type SitePageEditorRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly siteId: string;
    readonly pageId: string;
  }>;
};

export default async function Page({ params }: SitePageEditorRouteProps) {
  const config = loadPublicConfig();
  const { projectId, siteId, pageId } = await params;

  return (
    <PageEditorApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      siteId={siteId}
      pageId={pageId}
    />
  );
}

