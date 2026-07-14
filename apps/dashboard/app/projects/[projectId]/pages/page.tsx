import { loadPublicConfig } from "@site-platform/config";
import { LegacySiteRedirectApp } from "../../../legacy-site-redirect-app";

type LegacyPagesRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: LegacyPagesRouteProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return (
    <LegacySiteRedirectApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      target={{
        type: "section",
        section: "pages"
      }}
    />
  );
}

