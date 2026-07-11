import { loadPublicConfig } from "@site-platform/config";
import { ProjectWorkspaceApp } from "../../project-workspace-app";

type ProjectPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: ProjectPageProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return <ProjectWorkspaceApp apiUrl={config.apiUrl} projectId={projectId} />;
}
