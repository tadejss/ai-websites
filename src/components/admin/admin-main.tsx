export function AdminMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 overflow-x-hidden p-4 max-md:pb-28 md:p-6">
      {children}
    </main>
  );
}
