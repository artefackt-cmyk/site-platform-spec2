import { loadPublicConfig } from "@site-platform/config";
import { SiteManagementApp } from "../../../../../site-management-app";

type SiteSettingsPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly siteId: string;
  }>;
};

export default async function Page({ params }: SiteSettingsPageProps) {
  const config = loadPublicConfig();
  const { projectId, siteId } = await params;

  return (
    <SiteManagementApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      siteId={siteId}
      section="settings"
    />
  );
}

