import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl leading-none text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base leading-relaxed text-[#d0d0d0]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[var(--admin-radius)] border border-white/15 bg-white/[0.03] px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0d0d0]">
        {label}
      </div>
      <div className="font-display mt-2 text-3xl leading-none tabular-nums text-white">
        {value}
      </div>
      {sub ? (
        <div className="mt-1.5 text-sm text-[var(--admin-muted)]">{sub}</div>
      ) : null}
    </div>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-[var(--admin-muted)]">{message}</p>
  );
}

export function AdminTableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--admin-radius)] border border-white/15">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-[var(--admin-muted)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-[var(--admin-border)] px-3 py-2 text-[var(--admin-foreground)]",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString("sl-SI");
}
