import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password"
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = process.env.AUTH_SESSION_COOKIE_NAME ?? "mercurio_session";
  const hasSessionCookie = request.cookies.has(cookieName);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!hasSessionCookie && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSessionCookie && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/projects/:path*"
  ]
};
