import { loadPublicConfig } from "@site-platform/config";
import { redirect } from "next/navigation";
import {
  LegacySiteRedirectError,
  resolveLegacySiteRedirect
} from "../../../../legacy-site-redirect";

type PageEditorRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
    readonly pageId: string;
  }>;
};

export default async function Page({ params }: PageEditorRouteProps) {
  const config = loadPublicConfig();
  const { projectId, pageId } = await params;
  const result = await resolveLegacySiteRedirect({
    apiUrl: config.apiUrl,
    projectId,
    target: {
      type: "page-editor",
      pageId
    }
  });

  if (result.status === "redirect") {
    redirect(result.href);
  }

  return <LegacySiteRedirectError message={result.message} />;
}
