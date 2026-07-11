import { loadPublicConfig } from "@site-platform/config";
import { PagePreviewApp } from "../../../../../page-preview-app";

type PagePreviewRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly pageId: string;
  }>;
};

export default async function Page({ params }: PagePreviewRouteProps) {
  const config = loadPublicConfig();
  const { projectId, pageId } = await params;

  return (
    <PagePreviewApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      pageId={pageId}
    />
  );
}
