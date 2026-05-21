import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isDashboardRoute =
    pathname.startsWith("/dashboard");

  const isLoginRoute =
    pathname.startsWith("/login");

  const hasSupabaseAuth =
    request.cookies
      .getAll()
      .some((cookie) =>
        cookie.name.includes(
          "supabase"
        )
      );

  if (
    isDashboardRoute &&
    !hasSupabaseAuth
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
    hasSupabaseAuth
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