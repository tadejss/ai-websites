import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, getAdminSecret, isValidAdminToken } from "@/lib/auth";
import { getSlugForHost } from "@/lib/custom-domains";

/** Root paths that should resolve to the mapped client slug on a custom domain. */
const CUSTOM_DOMAIN_ROOT_PATHS = new Set([
  "/",
  "/politika-zasebnosti",
  "/piskotki",
  "/splosni-pogoji",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public demos: /demo/{slug} → existing /{slug} template routes.
  if (pathname.startsWith("/demo/")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname.slice("/demo".length) || "/";
    return NextResponse.rewrite(rewriteUrl);
  }

  const customSlug = getSlugForHost(request.headers.get("host"));

  if (customSlug && CUSTOM_DOMAIN_ROOT_PATHS.has(pathname)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname =
      pathname === "/" ? `/${customSlug}` : `/${customSlug}${pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

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
  matcher: [
    "/",
    "/politika-zasebnosti",
    "/piskotki",
    "/splosni-pogoji",
    "/demo/:path*",
    "/admin/:path*",
  ],
};
