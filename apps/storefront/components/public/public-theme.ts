export type PublicThemeMode = "light" | "dark" | "system";
export type PublicResolvedTheme = "light" | "dark";

export const publicThemeStorageKey = "mercurio-public-theme";
export const publicThemeCookieName = "mercurio-public-theme";

export function parsePublicThemeMode(value: string | null | undefined): PublicThemeMode {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

export function resolvePublicTheme(
  mode: PublicThemeMode,
  systemPrefersDark: boolean
): PublicResolvedTheme {
  return mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;
}

export function buildDashboardUrl(baseUrl: string, path: `/${string}`): string {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}
