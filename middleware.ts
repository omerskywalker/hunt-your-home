import { NextRequest, NextResponse } from "next/server";

const MONITOR_COOKIE = "_hyh_ok";
const LOGIN_PATH = "/monitor/login";
const MONITOR_PREFIX = "/monitor";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /monitor/* routes
  if (!pathname.startsWith(MONITOR_PREFIX)) {
    return NextResponse.next();
  }

  // Always allow the login page itself
  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  // Check for valid session cookie
  const session = request.cookies.get(MONITOR_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/monitor/:path*"],
};
