import { loadPublicConfig } from "@site-platform/config";
import { MediaLibraryApp } from "../../../media-library-app";

type ProjectMediaPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: ProjectMediaPageProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;

  return <MediaLibraryApp apiUrl={config.apiUrl} projectId={projectId} />;
}
