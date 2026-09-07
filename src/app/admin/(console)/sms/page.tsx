import Link from "next/link";
import { isDatabaseConfigured } from "@/db/client";
import { getSmsConfig, isSmsGatewayConfigured } from "@/outreach/sms/config";
import {
  countByLeadStatus,
  countSentToday,
  listSentSmsMessages,
  listSmsLeadStates,
} from "@/outreach/sms/store";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatGrid,
  AdminTableWrap,
  AdminTd,
  AdminTh,
  formatAdminDate,
} from "@/components/admin/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const dynamic = "force-dynamic";

const SENT_PAGE_SIZE = 25;

export default async function AdminSmsPage({
  searchParams,
}: PageProps<"/admin/sms">) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const smsConfig = getSmsConfig();
  const smsCounts = isDatabaseConfigured() ? await countByLeadStatus() : {};
  const sentToday = isDatabaseConfigured() ? await countSentToday() : 0;
  const states = isDatabaseConfigured() ? await listSmsLeadStates() : [];
  const sent = isDatabaseConfigured()
    ? await listSentSmsMessages({ page, pageSize: SENT_PAGE_SIZE })
    : { rows: [], total: 0, page, pageSize: SENT_PAGE_SIZE, totalPages: 0 };
  const recentFailed = states
    .filter((state) => state.smsStatus === "failed")
    .slice(0, 20);

  return (
    <div>
      <AdminPageHeader
        title="SMS command"
        description="Queue depth, daily cap, and failed messages"
      />

      <AdminStatGrid className="lg:grid-cols-5">
        <AdminStatCard label="Queued" value={String(smsCounts.queued ?? 0)} />
        <AdminStatCard label="Sent" value={String(smsCounts.sent ?? 0)} />
        <AdminStatCard label="Failed" value={String(smsCounts.failed ?? 0)} />
        <AdminStatCard
          label="Sent today"
          value={`${sentToday}/${smsConfig.dailyLimit}`}
        />
        <AdminStatCard
          label="Gateway"
          value={isSmsGatewayConfigured() ? "online" : "offline"}
        />
      </AdminStatGrid>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent failures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentFailed.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No failed SMS</p>
          ) : (
            recentFailed.map((state) => (
              <div
                key={state.slug}
                className="flex justify-between rounded border border-[var(--admin-border)] px-3 py-2 text-sm"
              >
                <span className="font-mono">{state.slug}</span>
                <span className="text-xs text-[var(--admin-muted)]">
                  {state.smsLastError ?? state.smsStatus}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Poslani SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent.rows.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">Ni poslanih SMS</p>
          ) : (
            <>
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminTh>Številka</AdminTh>
                    <AdminTh>Datum in čas</AdminTh>
                    <AdminTh>Besedilo</AdminTh>
                  </tr>
                </thead>
                <tbody>
                  {sent.rows.map((msg) => (
                    <tr key={msg.messageId}>
                      <AdminTd className="align-top font-mono whitespace-nowrap">
                        {msg.toPhone}
                      </AdminTd>
                      <AdminTd className="align-top whitespace-nowrap text-[var(--admin-muted)]">
                        {formatAdminDate(msg.sentAt ?? msg.createdAt)}
                      </AdminTd>
                      <AdminTd className="max-w-xl whitespace-pre-wrap break-words">
                        {msg.body}
                      </AdminTd>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>

              <SentPagination page={sent.page} totalPages={sent.totalPages} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SentPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link
          href={`/admin/sms?page=${page - 1}`}
          className="text-[var(--admin-accent)] hover:underline"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[var(--admin-muted)]">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={`/admin/sms?page=${page + 1}`}
          className="text-[var(--admin-accent)] hover:underline"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
