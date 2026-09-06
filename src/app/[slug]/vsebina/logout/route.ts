import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ONBOARDING_SESSION_COOKIE,
  getOnboardingSessionCookieOptions,
  revokeOnboardingSession,
} from "@/lib/onboarding-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/** Revoke the current onboarding session and clear the cookie. */
export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(ONBOARDING_SESSION_COOKIE)?.value;
  await revokeOnboardingSession(token);

  cookieStore.set(ONBOARDING_SESSION_COOKIE, "", {
    ...getOnboardingSessionCookieOptions(new Date(0)),
    maxAge: 0,
  });

  const loginUrl = new URL(`/${slug}/vsebina`, request.url);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request, context: RouteContext) {
  return POST(request, context);
}
