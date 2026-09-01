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
        <h1 className="text-xl font-semibold tracking-tight text-[var(--admin-foreground)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
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
    <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--admin-muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--admin-foreground)]">
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-xs text-[var(--admin-muted)]">{sub}</div>
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
    <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
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
        "border-b border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-muted)]",
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
