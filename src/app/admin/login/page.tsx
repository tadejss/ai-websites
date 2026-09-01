import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getAdminSecret, isValidAdminToken } from "@/lib/auth";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const secret = getAdminSecret();

  if (!secret || !isValidAdminToken(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

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
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-[var(--admin-muted)]">
          Ops Console
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Admin login</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Enter the admin secret to access the factory console.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block text-sm">
              <span className="text-[var(--admin-muted)]">Password</span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full min-h-[44px] rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-base text-[var(--admin-foreground)] outline-none focus:ring-2 focus:ring-cyan-500/40 touch-manipulation"
              />
            </label>

            {error ? (
              <p className="text-sm text-red-400">Invalid password.</p>
            ) : null}

            <Button type="submit" className="h-11 w-full touch-manipulation">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
