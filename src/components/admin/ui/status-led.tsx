import { cn } from "@/lib/utils";

type StatusLevel = "ok" | "warning" | "failed" | "idle";

const levelStyles: Record<StatusLevel, string> = {
  ok: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
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
}: {
  label: string;
  level: StatusLevel;
  detail?: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <StatusLed level={level} pulse={pulse} />
      <span className="text-[var(--admin-muted)]">{label}</span>
      {detail ? (
        <span className="font-mono text-[var(--admin-foreground)]">{detail}</span>
      ) : null}
    </div>
  );
}
