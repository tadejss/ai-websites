import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, getAdminSecret, isValidAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin/leads");
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

  redirect(next.startsWith("/admin") ? next : "/admin/leads");
}

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const params = await searchParams;
  const error = params.error === "1";
  const next = typeof params.next === "string" ? params.next : "/admin/leads";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold">Admin login</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Enter the admin secret to manage leads and outreach.
      </p>

      <form action={loginAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600">Invalid password.</p>
        ) : null}

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
