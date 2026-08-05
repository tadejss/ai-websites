export function Section({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  );
}
