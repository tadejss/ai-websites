/**
 * Plain request context extracted during the page render (before after()).
 * Do not pass Headers objects into deferred callbacks.
 */
export type DemoViewContext = {
  userAgent: string;
  purpose: string | null;
  secPurpose: string | null;
  secFetchDest: string | null;
  isRscRequest: boolean;
  isRouterPrefetch: boolean;
  clientIp: string | null;
};

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slackbot|linkedinbot|discordbot|embedly|quora link preview|googlebot|bingbot|yandex|baiduspider|duckduckbot|applebot|petalbot|semrush|ahrefs|mj12bot|dotbot|rogerbot|screaming frog|headlesschrome|phantomjs/i;

export function extractViewContext(headers: Headers): DemoViewContext {
  return {
    userAgent: headers.get("user-agent")?.trim() ?? "",
    purpose: headers.get("purpose")?.trim().toLowerCase() ?? null,
    secPurpose: headers.get("sec-purpose")?.trim().toLowerCase() ?? null,
    secFetchDest: headers.get("sec-fetch-dest")?.trim().toLowerCase() ?? null,
    isRscRequest: Boolean(headers.get("rsc")?.trim()),
    isRouterPrefetch: Boolean(headers.get("next-router-prefetch")?.trim()),
    clientIp: resolveClientIp(headers),
  };
}

function resolveClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) {
    return forwarded;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || null;
}

export function shouldCountDemoView(context: DemoViewContext): boolean {
  if (!context.userAgent) {
    return false;
  }

  if (BOT_UA_PATTERN.test(context.userAgent)) {
    return false;
  }

  if (context.purpose === "prefetch") {
    return false;
  }

  if (context.secPurpose?.includes("prefetch")) {
    return false;
  }

  if (context.isRscRequest || context.isRouterPrefetch) {
    return false;
  }

  if (
    context.secFetchDest &&
    context.secFetchDest !== "document" &&
    context.secFetchDest !== "empty"
  ) {
    return false;
  }

  if (/vercel-cron\/\d/i.test(context.userAgent)) {
    return false;
  }

  return true;
}
