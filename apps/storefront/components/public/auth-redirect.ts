import { loadPublicConfig } from "@site-platform/config";
import { buildDashboardUrl } from "./public-theme";

type AuthRedirectKind = "login" | "register";
type SearchParams = Record<string, string | string[] | undefined>;

const allowedPassthroughParams = new Set(["returnTo", "source"]);

export function buildAuthRedirectUrl(kind: AuthRedirectKind, searchParams: SearchParams = {}): string {
  const config = loadPublicConfig();
  const url = new URL(buildDashboardUrl(config.dashboardUrl, `/${kind}`));

  for (const [key, value] of Object.entries(searchParams)) {
    if (!allowedPassthroughParams.has(key)) {
      continue;
    }

    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue !== undefined && firstValue.trim() !== "") {
      url.searchParams.set(key, firstValue);
    }
  }

  return url.toString();
}
