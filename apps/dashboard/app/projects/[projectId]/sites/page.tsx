import { loadPublicConfig } from "@site-platform/config";
import { SiteManagementApp } from "../../../site-management-app";

type ProjectSitesPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: ProjectSitesPageProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return (
    <SiteManagementApp
      apiUrl={config.apiUrl}
      projectId={projectId}
      section="project-sites"
    />
  );
}

