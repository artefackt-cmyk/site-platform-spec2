import { loadPublicConfig } from "@site-platform/config";
import { LegacySiteRedirectApp } from "../../../legacy-site-redirect-app";

type LegacyPublicationRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: LegacyPublicationRouteProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return (
    <LegacySiteRedirectApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      target={{
        type: "section",
        section: "publication"
      }}
    />
  );
}

