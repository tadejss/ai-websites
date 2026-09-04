/** Paths that must not rewrite to /{slug} on a customer custom host. */
export function shouldSkipCustomerHostRewrite(pathname: string): boolean {
  return (
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

/** Internal path for a customer custom host. Query string is not part of pathname. */
export function customerHostRewritePath(pathname: string, slug: string): string {
  if (pathname === "/" || pathname === "") {
    return `/${slug}`;
  }
  return `/${slug}${pathname}`;
}
