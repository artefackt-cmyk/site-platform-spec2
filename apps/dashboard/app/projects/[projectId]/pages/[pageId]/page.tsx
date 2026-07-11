import { loadPublicConfig } from "@site-platform/config";
import { PageEditorApp } from "../../../../page-editor-app";

type PageEditorRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly pageId: string;
  }>;
};

export default async function Page({ params }: PageEditorRouteProps) {
  const config = loadPublicConfig();
  const { projectId, pageId } = await params;

  return (
    <PageEditorApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      pageId={pageId}
    />
  );
}
