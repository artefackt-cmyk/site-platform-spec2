import { loadPublicConfig } from "@site-platform/config";
import { LegacySiteRedirectApp } from "../../../legacy-site-redirect-app";

type LegacySettingsRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: LegacySettingsRouteProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return (
    <LegacySiteRedirectApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      target={{
        type: "section",
        section: "settings"
      }}
    />
  );
}

