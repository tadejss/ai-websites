import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
        <h1 className="font-display text-3xl leading-tight text-white sm:text-4xl">
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
        "mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

const STAT_TONE: Record<
  "default" | "accent" | "warning" | "danger",
  string
> = {
  default: "border-white/15 bg-white/[0.03]",
  accent: "border-[var(--admin-accent)]/30 bg-[var(--admin-accent)]/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  danger: "border-red-500/30 bg-red-500/10",
};

export function AdminStatCard({
  label,
  value,
  sub,
  href,
  tone = "default",
  variant = "default",
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  tone?: "default" | "accent" | "warning" | "danger";
  variant?: "default" | "hero";
  className?: string;
}) {
  const isHero = variant === "hero";
  const cardClassName = cn(
    "relative overflow-hidden rounded-[var(--admin-radius)] border",
    STAT_TONE[tone],
    isHero ? "px-5 py-6" : "px-4 py-4",
    href && "transition-colors hover:border-white/25",
    className,
  );

  const content = (
    <>
      {isHero && tone === "accent" ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(199,255,61,0.22),transparent_55%)]"
          aria-hidden
        />
      ) : isHero && tone === "danger" ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(248,113,113,0.22),transparent_55%)]"
          aria-hidden
        />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0d0d0]">
          {label}
        </div>
        {href ? (
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
        ) : null}
      </div>
      <div
        className={cn(
          "font-display relative mt-2 leading-none tabular-nums text-white",
          isHero ? "text-5xl sm:text-6xl" : "text-3xl",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="relative mt-1.5 text-sm text-[var(--admin-muted)]">{sub}</div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardClassName, "block")}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
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
