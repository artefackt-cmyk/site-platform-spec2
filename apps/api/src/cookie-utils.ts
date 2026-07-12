import type { AppConfig } from "@site-platform/config";

export function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (cookieHeader === undefined || cookieHeader.trim() === "") {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }

  return null;
}

export function createSessionCookieOptions(config: AppConfig): {
  readonly httpOnly: true;
  readonly secure: boolean;
  readonly sameSite: "lax";
  readonly path: "/";
  readonly maxAge: number;
} {
  return {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: config.auth.sessionTtlDays * 24 * 60 * 60 * 1000
  };
}
