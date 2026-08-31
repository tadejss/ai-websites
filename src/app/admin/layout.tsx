import Link from "next/link";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/leads" className="font-semibold">
              Website Factory Admin
            </Link>
            <nav className="text-sm text-neutral-600">
              <Link href="/admin/leads" className="hover:text-neutral-900">
                Leads
              </Link>
              {" · "}
              <Link href="/admin/factory" className="hover:text-neutral-900">
                Factory
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
