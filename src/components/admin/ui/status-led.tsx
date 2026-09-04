import { cn } from "@/lib/utils";

type StatusLevel = "ok" | "warning" | "failed" | "idle";

const levelStyles: Record<StatusLevel, string> = {
  ok: "bg-[var(--admin-accent)] shadow-[0_0_8px_rgba(199,255,61,0.55)]",
  warning: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  failed: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]",
  idle: "bg-zinc-500",
};

export function StatusLed({
  level,
  pulse = false,
  className,
}: {
  level: StatusLevel;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        levelStyles[level],
        pulse && level !== "idle" && "animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}

export function StatusIndicator({
  label,
  level,
  detail,
  pulse,
  compact = false,
}: {
  label: string;
  level: StatusLevel;
  detail?: string;
  pulse?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "text-sm" : "text-base")}>
      <StatusLed level={level} pulse={pulse} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d0d0d0]">{label}</span>
      {detail ? (
        <span className="truncate font-mono text-[var(--admin-foreground)]">{detail}</span>
      ) : null}
    </div>
  );
}
