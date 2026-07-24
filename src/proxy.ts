import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";

// Gate every /admin/* route behind the shared admin password — except the
// login page itself, which is what issues the session cookie in the first
// place. Optimistic check only (reads the cookie, no DB) per Next's own
// guidance for Proxy; that's fine here since there's no per-user data to
// protect, just one shared admin surface.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
