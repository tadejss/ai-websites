import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import {
  extractDemoSlugFromPathname,
  scheduleDemoViewFromRequest,
} from "@/demo-lifecycle/middleware-demo-view";
import { ADMIN_COOKIE, getAdminSecret } from "@/lib/auth";
import { validateAdminSessionToken } from "@/lib/admin-session";
import { isDatabaseConfigured } from "@/db/client";
import { getSlugForHost } from "@/lib/custom-domains";
import { lookupLiveWebsiteSlugCached } from "@/website-domains/lookup-cache";
import {
  customerHostRewritePath,
  shouldSkipCustomerHostRewrite,
} from "@/website-domains/rewrite";
import { applySecurityHeaders } from "@/lib/security-headers";

/** Root paths that should resolve to the mapped client slug on a custom domain. */
const CUSTOM_DOMAIN_ROOT_PATHS = new Set([
  "/",
  "/politika-zasebnosti",
  "/piskotki",
  "/splosni-pogoji",
  "/pogosta-vprasanja",
]);

function withSecurityHeaders(
  response: NextResponse,
  pathname: string,
): NextResponse {
  applySecurityHeaders(response.headers, {
    admin: pathname.startsWith("/admin"),
  });
  return response;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (request.method === "GET") {
    const demoSlug = extractDemoSlugFromPathname(pathname);
    if (demoSlug) {
      event.waitUntil(
        Promise.resolve().then(() =>
          scheduleDemoViewFromRequest(demoSlug, request.headers),
        ),
      );
    }
  }

  if (host === "splet.vercel.app" || host === "www.splet.vercel.app") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "zbrendiraj.si";
    url.port = "";
    return withSecurityHeaders(NextResponse.redirect(url, 308), pathname);
  }

  if (pathname.startsWith("/demo/")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname.slice("/demo".length) || "/";
    return withSecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
  }

  const marketingSlug = getSlugForHost(request.headers.get("host"));

  if (marketingSlug && CUSTOM_DOMAIN_ROOT_PATHS.has(pathname)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname =
      pathname === "/" ? `/${marketingSlug}` : `/${marketingSlug}${pathname}`;
    return withSecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
  }

  if (!marketingSlug && !shouldSkipCustomerHostRewrite(pathname)) {
    try {
      const liveSlug = await lookupLiveWebsiteSlugCached(
        request.headers.get("host"),
      );
      if (liveSlug) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = customerHostRewritePath(pathname, liveSlug);
        return withSecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
      }
    } catch {
      // Fail-open: custom host stays unresolved; platform hosts keep working.
    }
  }

  if (!pathname.startsWith("/admin")) {
    return withSecurityHeaders(NextResponse.next(), pathname);
  }

  if (
    pathname === "/admin/login" ||
    pathname === "/admin/logout" ||
    pathname === "/admin/manifest.webmanifest"
  ) {
    return withSecurityHeaders(NextResponse.next(), pathname);
  }

  const secret = getAdminSecret();

  if (!secret) {
    return withSecurityHeaders(
      new NextResponse("Admin access is not configured.", { status: 503 }),
      pathname,
    );
  }

  if (!isDatabaseConfigured()) {
    return withSecurityHeaders(
      new NextResponse("Admin sessions require a database.", {
        status: 503,
      }),
      pathname,
    );
  }

  const session = request.cookies.get(ADMIN_COOKIE)?.value;

  let sessionValid = false;
  try {
    sessionValid = await validateAdminSessionToken(session);
  } catch {
    sessionValid = false;
  }

  if (!sessionValid) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);

    return withSecurityHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  return withSecurityHeaders(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
