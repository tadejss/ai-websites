import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getAdminSecret, isValidAdminToken } from "@/lib/auth";
import { AdminBrandMark, AdminWordmark } from "@/components/admin/admin-brand";
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
        <div className="mb-5 flex items-center gap-3">
          <AdminBrandMark size={44} />
          <AdminWordmark className="text-2xl" />
        </div>
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.25em] text-[var(--admin-accent)]">
          <span className="size-1.5 rounded-full bg-[var(--admin-accent)]" aria-hidden="true" />
          Ops console
        </p>
        <h1 className="mt-2 text-3xl">Prijava</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block text-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0d0d0]">
                Geslo
              </span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full min-h-11 rounded-2xl border border-white/20 bg-black px-4 text-base text-white outline-none transition-colors placeholder:text-[#9a9a9a] focus:border-[var(--admin-accent)] touch-manipulation"
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
