import { loadPublicConfig } from "@site-platform/config";
import { redirect } from "next/navigation";
import {
  LegacySiteRedirectError,
  resolveLegacySiteRedirect
} from "../../../legacy-site-redirect";

type LegacySettingsRouteProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function Page({ params }: LegacySettingsRouteProps) {
  const config = loadPublicConfig();
  const { projectId } = await params;
  const result = await resolveLegacySiteRedirect({
    apiUrl: config.apiUrl,
    projectId,
    target: {
      type: "section",
      section: "settings"
    }
  });

  if (result.status === "redirect") {
    redirect(result.href);
  }

  return <LegacySiteRedirectError message={result.message} />;
}
