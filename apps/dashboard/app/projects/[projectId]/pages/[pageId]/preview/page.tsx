import { loadPublicConfig } from "@site-platform/config";
import { LegacySiteRedirectApp } from "../../../../../legacy-site-redirect-app";

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
    <LegacySiteRedirectApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      target={{
        type: "page-preview",
        pageId
      }}
    />
  );
}
