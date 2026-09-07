import Link from "next/link";
import { isDatabaseConfigured } from "@/db/client";
import { getSmsConfig, isSmsGatewayConfigured } from "@/outreach/sms/config";
import {
  countByLeadStatus,
  countSentToday,
  listInboxInboundMessages,
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
const INBOUND_PAGE_SIZE = 25;

type SmsView = "outbound" | "inbound";

function resolveSmsView(value: string | undefined): SmsView {
  return value === "inbound" ? "inbound" : "outbound";
}

export default async function AdminSmsPage({
  searchParams,
}: PageProps<"/admin/sms">) {
  const params = await searchParams;
  const view = resolveSmsView(
    typeof params.view === "string" ? params.view : undefined,
  );
  const page = Math.max(1, Number(params.page) || 1);
  const smsConfig = getSmsConfig();
  const dbReady = isDatabaseConfigured();

  const smsCounts = dbReady ? await countByLeadStatus() : {};
  const sentToday = dbReady ? await countSentToday() : 0;
  const states = view === "outbound" && dbReady ? await listSmsLeadStates() : [];
  const sent =
    view === "outbound" && dbReady
      ? await listSentSmsMessages({ page, pageSize: SENT_PAGE_SIZE })
      : { rows: [], total: 0, page, pageSize: SENT_PAGE_SIZE, totalPages: 0 };
  const inbound =
    view === "inbound" && dbReady
      ? await listInboxInboundMessages({ page, pageSize: INBOUND_PAGE_SIZE })
      : { rows: [], total: 0, page, pageSize: INBOUND_PAGE_SIZE, totalPages: 0 };
  const recentFailed = states
    .filter((state) => state.smsStatus === "failed")
    .slice(0, 20);

  return (
    <div>
      <AdminPageHeader
        title="SMS command"
        description="Queue depth, daily cap, outbound history, and inbound replies needing attention"
      />

      <div className="mt-2 flex gap-4 text-sm">
        <Link
          href="/admin/sms"
          className={
            view === "outbound"
              ? "font-medium text-[var(--admin-fg)]"
              : "text-[var(--admin-accent)] hover:underline"
          }
        >
          Outbound
        </Link>
        <Link
          href="/admin/sms?view=inbound"
          className={
            view === "inbound"
              ? "font-medium text-[var(--admin-fg)]"
              : "text-[var(--admin-accent)] hover:underline"
          }
        >
          Inbound
        </Link>
      </div>

      <AdminStatGrid className="mt-4 lg:grid-cols-5">
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

      {view === "outbound" ? (
        <>
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

                  <SmsPagination
                    page={sent.page}
                    totalPages={sent.totalPages}
                    hrefForPage={(nextPage) =>
                      nextPage <= 1 ? "/admin/sms" : `/admin/sms?page=${nextPage}`
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Inbound</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!dbReady ? (
              <p className="text-sm text-[var(--admin-muted)]">
                Database not configured
              </p>
            ) : inbound.rows.length === 0 ? (
              <p className="text-sm text-[var(--admin-muted)]">
                No inbound replies needing attention
              </p>
            ) : (
              <>
                <AdminTableWrap>
                  <thead>
                    <tr>
                      <AdminTh>Received</AdminTh>
                      <AdminTh>Lead</AdminTh>
                      <AdminTh>From</AdminTh>
                      <AdminTh>Message</AdminTh>
                      <AdminTh>Status</AdminTh>
                      <AdminTh>Action</AdminTh>
                    </tr>
                  </thead>
                  <tbody>
                    {inbound.rows.map((msg) => {
                      const hasLead = msg.matched && msg.slug != null;
                      return (
                        <tr key={msg.id}>
                          <AdminTd className="align-top whitespace-nowrap text-[var(--admin-muted)]">
                            {formatAdminDate(msg.receivedAt)}
                          </AdminTd>
                          <AdminTd className="align-top">
                            {hasLead ? (
                              <div className="space-y-0.5">
                                <Link
                                  href={`/admin/e/${msg.slug}`}
                                  className="font-medium text-[var(--admin-accent)] hover:underline"
                                >
                                  {msg.companyName ?? msg.slug}
                                </Link>
                                <p className="font-mono text-xs text-[var(--admin-muted)]">
                                  {msg.slug}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-[var(--admin-muted)]">
                                No lead match
                              </span>
                            )}
                          </AdminTd>
                          <AdminTd className="align-top font-mono whitespace-nowrap">
                            {msg.fromPhone}
                          </AdminTd>
                          <AdminTd className="max-w-xl whitespace-pre-wrap break-words">
                            {msg.body}
                          </AdminTd>
                          <AdminTd className="align-top whitespace-nowrap text-[var(--admin-muted)]">
                            {msg.smsStatus ?? "—"}
                          </AdminTd>
                          <AdminTd className="align-top whitespace-nowrap">
                            {hasLead ? (
                              <Link
                                href={`/admin/e/${msg.slug}`}
                                className="text-[var(--admin-accent)] hover:underline"
                              >
                                Open lead
                              </Link>
                            ) : (
                              "—"
                            )}
                          </AdminTd>
                        </tr>
                      );
                    })}
                  </tbody>
                </AdminTableWrap>

                <SmsPagination
                  page={inbound.page}
                  totalPages={inbound.totalPages}
                  hrefForPage={(nextPage) =>
                    nextPage <= 1
                      ? "/admin/sms?view=inbound"
                      : `/admin/sms?view=inbound&page=${nextPage}`
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SmsPagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
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
          href={hrefForPage(page + 1)}
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
