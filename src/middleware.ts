import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, getAdminSecret, isValidAdminToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const secret = getAdminSecret();

  if (!secret) {
    return new NextResponse("Admin access is not configured.", { status: 503 });
  }

  const session = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!isValidAdminToken(session)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
