import type { ReactNode } from "react";

type Props = {
  url?: string;
  children: ReactNode;
  className?: string;
};

export function BeautyBrowserFrame({ url, children, className = "" }: Props) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#E8A598]" />
          <span className="size-2.5 rounded-full bg-[#E8C87A]" />
          <span className="size-2.5 rounded-full bg-[#9BC89B]" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-1.5 text-xs text-muted">
          {url ?? "tvoja-stran.si"}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
