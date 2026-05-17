import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(
    "sb-access-token"
  );

  const isLoginPage =
    request.nextUrl.pathname === "/login";

  const isDashboard =
    request.nextUrl.pathname.startsWith(
      "/dashboard"
    );

  if (!token && isDashboard) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};