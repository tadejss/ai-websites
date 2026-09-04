import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { formatAdminDate } from "@/components/admin/admin-page";
import type { InboxItem } from "@/admin/inbox";

export function InboxColumn({
  title,
  count,
  items,
  emptyMessage,
}: {
  title: string;
  count: number;
  items: InboxItem[];
  emptyMessage: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="rounded-full bg-[var(--admin-surface-elevated)] px-2 py-0.5 text-xs font-mono tabular-nums text-[var(--admin-accent)]">
            {count}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 p-0 pb-3">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-[var(--admin-muted)]">
            {emptyMessage}
          </p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  className="block border-t border-[var(--admin-border)] px-4 py-3 transition-colors hover:bg-[var(--admin-surface-elevated)]"
                >
                  <div className="font-medium text-[var(--admin-foreground)]">
                    {item.companyName}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-[var(--admin-muted)]">
                    <span className="truncate">{item.subtitle}</span>
                    <span className="shrink-0 font-mono">
                      {formatAdminDate(item.updatedAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
