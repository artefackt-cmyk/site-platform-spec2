import { loadPublicConfig } from "@site-platform/config";
import { SiteManagementApp } from "../../../../site-management-app";

type SiteOverviewPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly siteId: string;
  }>;
};

export default async function Page({ params }: SiteOverviewPageProps) {
  const config = loadPublicConfig();
  const { projectId, siteId } = await params;

  return (
    <SiteManagementApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      siteId={siteId}
      section="overview"
    />
  );
}

