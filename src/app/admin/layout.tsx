import "@/app/globals.css";

export default function AdminRootLayout({
  children,
}: LayoutProps<"/admin">) {
  return (
    <div data-admin-theme className="min-h-screen antialiased">
      {children}
    </div>
  );
}
