import { loadPublicConfig } from "@site-platform/config";
import { redirect } from "next/navigation";
import {
  LegacySiteRedirectError,
  resolveLegacySiteRedirect
} from "../../../../../legacy-site-redirect";

type PagePreviewRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly pageId: string;
  }>;
};

export default async function Page({ params }: PagePreviewRouteProps) {
  const config = loadPublicConfig();
  const { projectId, pageId } = await params;
  const result = await resolveLegacySiteRedirect({
    apiUrl: config.apiUrl,
    projectId,
    target: {
      type: "page-preview",
      pageId
    }
  });

  if (result.status === "redirect") {
    redirect(result.href);
  }

  return <LegacySiteRedirectError message={result.message} />;
}
