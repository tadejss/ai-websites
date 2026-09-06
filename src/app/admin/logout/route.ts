import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";
import {
  getAdminSessionCookieOptions,
  revokeAdminSession,
} from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Invalidate the current admin session server-side and clear the cookie.
 * Allowed without prior middleware auth so stale cookies can still be cleared.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  await revokeAdminSession(token);

  // Expire immediately; options still satisfy __Host- requirements.
  cookieStore.set(ADMIN_COOKIE, "", {
    ...getAdminSessionCookieOptions(new Date(0)),
    maxAge: 0,
  });

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export async function POST(request: Request) {
  return GET(request);
}
