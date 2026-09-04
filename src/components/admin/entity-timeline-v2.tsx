"use client";

import { formatAdminDate } from "@/components/admin/admin-page";
import type { TimelineEvent } from "@/admin/entity";

function groupByDay(events: TimelineEvent[]): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const day = event.at
      ? new Date(event.at).toLocaleDateString("sl-SI", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      : "Unknown";
    const list = groups.get(day) ?? [];
    list.push(event);
    groups.set(day, list);
  }
  return groups;
}

const KIND_ICON: Record<string, string> = {
  sms_sent: "📱",
  sms_failed: "✕",
  demo_view: "👁",
  published: "🚀",
  onboarding: "📝",
  purchase: "💳",
  default: "●",
};

export function EntityTimelineV2({ events }: { events: TimelineEvent[] }) {
  const groups = groupByDay(events);

  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">No events yet</p>
    );
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([day, dayEvents]) => (
        <div key={day}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            {day}
          </h3>
          <ol className="space-y-3">
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className="flex gap-3 rounded-2xl border border-white/15 px-3 py-2"
              >
                <span className="text-sm">
                  {KIND_ICON[event.kind] ?? KIND_ICON.default}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{event.label}</div>
                  <div className="text-xs text-[var(--admin-muted)]">
                    {formatAdminDate(event.at)}
                  </div>
                  {event.detail ? (
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {event.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
