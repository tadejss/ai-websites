/**
 * HTTP security header baseline for platform + customer sites.
 *
 * CSP notes:
 * - next/font self-hosts fonts → font-src 'self'
 * - Stripe Pricing Table needs js.stripe.com + frame-src
 * - Vercel Blob public images for onboarding uploads
 * - style-src 'unsafe-inline' required for Next/Tailwind inline styles
 * - script-src avoids 'unsafe-eval'; 'unsafe-inline' needed for Next hydration
 *   without a nonce pipeline (documented trade-off)
 * - Primeri iframe previews need frame-src 'self' (parent) and
 *   frame-ancestors 'self' (demo pages); admin uses frame-ancestors 'none'
 */

export const BASE_SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://*.blob.vercel-storage.com https://*.stripe.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://*.stripe.com",
  "form-action 'self' https://checkout.stripe.com https://*.stripe.com",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const ADMIN_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function productionHstsHeader(): { key: string; value: string } | null {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    return null;
  }
  // Platform apex + www are HTTPS. Customer custom domains are separate hosts
  // and do not inherit this HSTS policy.
  return {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  };
}

export function applySecurityHeaders(
  headers: Headers,
  options?: { admin?: boolean },
): void {
  for (const header of BASE_SECURITY_HEADERS) {
    headers.set(header.key, header.value);
  }

  const hsts = productionHstsHeader();
  if (hsts) {
    headers.set(hsts.key, hsts.value);
  }

  if (options?.admin) {
    headers.set("Content-Security-Policy", ADMIN_CONTENT_SECURITY_POLICY);
    headers.set("X-Frame-Options", "DENY");
  } else {
    headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
    headers.set("X-Frame-Options", "SAMEORIGIN");
  }
}
