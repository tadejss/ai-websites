import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSecret, isValidAdminToken } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/client";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminSessionCookieOptions,
} from "@/lib/admin-session";
import { resolveClientIp, hashRateLimitMaterial } from "@/lib/client-ip";
import { checkRateLimit } from "@/lib/rate-limit";
import { AdminBrandMark } from "@/components/admin/admin-brand";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const secret = getAdminSecret();

  const headerStore = await headers();
  const ip = resolveClientIp(headerStore);
  const rateKey = await hashRateLimitMaterial(`admin-login:${ip}`);
  const limited = await checkRateLimit({
    key: rateKey,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.allowed) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  if (!secret || !isValidAdminToken(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  if (!isDatabaseConfigured()) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const session = await createAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    session.token,
    getAdminSessionCookieOptions(session.expiresAt),
  );

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const params = await searchParams;
  const error = params.error === "1";
  const next = typeof params.next === "string" ? params.next : "/admin";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex justify-center">
        <AdminBrandMark size={44} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block text-sm">
              <span className="sr-only">Geslo</span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Geslo"
                className="w-full min-h-11 rounded-2xl border border-white/20 bg-black px-4 text-base text-white outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[var(--admin-accent)] touch-manipulation"
              />
            </label>

            {error ? (
              <p className="text-sm text-red-400">Napačno geslo.</p>
            ) : null}

            <Button type="submit" className="h-12 w-full touch-manipulation">
              Vstopi
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
