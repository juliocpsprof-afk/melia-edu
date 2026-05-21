import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session =
    request.cookies.get("sb-access-token") ||
    request.cookies.get(
      "supabase-auth-token"
    );

  const isDashboardRoute =
    request.nextUrl.pathname.startsWith(
      "/dashboard"
    );

  const isLoginRoute =
    request.nextUrl.pathname === "/login";

  if (
    isDashboardRoute &&
    !session
  ) {
    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  if (
    isLoginRoute &&
    session
  ) {
    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};