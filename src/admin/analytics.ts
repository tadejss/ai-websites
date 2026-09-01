import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export type RevenueAnalytics = {
  mrrEur: number;
  arrEur: number;
  customerCount: number;
  monthlyCount: number;
  yearlyCount: number;
  purchasesThisWeek: number;
  purchasesThisMonth: number;
  upsellCounts: Record<string, number>;
  funnel: {
    published: number;
    viewed: number;
    purchased: number;
    live: number;
  };
  sms: {
    sent: number;
    replied: number;
    optedOut: number;
    replyRate: number;
  };
};

const MONTHLY_PRICE = 35;
const YEARLY_PRICE = 350;

export async function getRevenueAnalytics(): Promise<RevenueAnalytics> {
  const empty: RevenueAnalytics = {
    mrrEur: 0,
    arrEur: 0,
    customerCount: 0,
    monthlyCount: 0,
    yearlyCount: 0,
    purchasesThisWeek: 0,
    purchasesThisMonth: 0,
    upsellCounts: {},
    funnel: { published: 0, viewed: 0, purchased: 0, live: 0 },
    sms: { sent: 0, replied: 0, optedOut: 0, replyRate: 0 },
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  await ensureCustomerSchema();
  const db = sql();

  const planRows = (await db`
    SELECT subscription_plan, COUNT(*)::int AS count
    FROM customers
    GROUP BY subscription_plan
  `) as Array<{ subscription_plan: string | null; count: number }>;

  let monthlyCount = 0;
  let yearlyCount = 0;
  for (const row of planRows) {
    if (row.subscription_plan === "monthly") {
      monthlyCount = row.count;
    } else if (row.subscription_plan === "yearly") {
      yearlyCount = row.count;
    }
  }

  const customerCount = monthlyCount + yearlyCount;
  const mrrEur =
    monthlyCount * MONTHLY_PRICE + (yearlyCount * YEARLY_PRICE) / 12;
  const arrEur = mrrEur * 12;

  const purchaseWindowRows = (await db`
    SELECT
      COUNT(*) FILTER (
        WHERE purchased_at >= NOW() - INTERVAL '7 days'
          AND purchase_kind = 'base_subscription'
      )::int AS week_count,
      COUNT(*) FILTER (
        WHERE purchased_at >= NOW() - INTERVAL '30 days'
          AND purchase_kind = 'base_subscription'
      )::int AS month_count
    FROM customer_purchases
  `) as Array<{ week_count: number; month_count: number }>;

  const upsellRows = (await db`
    SELECT upsell_type, COUNT(*)::int AS count
    FROM customer_purchases
    WHERE upsell_type IS NOT NULL
    GROUP BY upsell_type
  `) as Array<{ upsell_type: string; count: number }>;

  const upsellCounts: Record<string, number> = {};
  for (const row of upsellRows) {
    upsellCounts[row.upsell_type] = row.count;
  }

  const funnelRows = (await db`
    SELECT
      COUNT(*) FILTER (WHERE lifecycle_status IN ('published', 'viewed', 'purchased'))::int AS published,
      COUNT(*) FILTER (WHERE lifecycle_status IN ('viewed', 'purchased'))::int AS viewed,
      COUNT(*) FILTER (WHERE lifecycle_status = 'purchased')::int AS purchased
    FROM demo_lifecycle
  `) as Array<{ published: number; viewed: number; purchased: number }>;

  const liveRows = (await db`
    SELECT COUNT(*)::int AS count
    FROM customer_onboarding
    WHERE status = 'live'
  `) as Array<{ count: number }>;

  const smsRows = (await db`
    SELECT
      COUNT(*) FILTER (WHERE sms_status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE sms_status = 'replied')::int AS replied,
      COUNT(*) FILTER (WHERE sms_status = 'opted_out')::int AS opted_out
    FROM sms_lead_state
  `) as Array<{ sent: number; replied: number; opted_out: number }>;

  const sms = smsRows[0] ?? { sent: 0, replied: 0, opted_out: 0 };
  const replyRate =
    sms.sent > 0 ? Math.round((sms.replied / sms.sent) * 1000) / 10 : 0;

  return {
    mrrEur: Math.round(mrrEur * 100) / 100,
    arrEur: Math.round(arrEur * 100) / 100,
    customerCount,
    monthlyCount,
    yearlyCount,
    purchasesThisWeek: purchaseWindowRows[0]?.week_count ?? 0,
    purchasesThisMonth: purchaseWindowRows[0]?.month_count ?? 0,
    upsellCounts,
    funnel: {
      published: funnelRows[0]?.published ?? 0,
      viewed: funnelRows[0]?.viewed ?? 0,
      purchased: funnelRows[0]?.purchased ?? 0,
      live: liveRows[0]?.count ?? 0,
    },
    sms: {
      sent: sms.sent,
      replied: sms.replied,
      optedOut: sms.opted_out,
      replyRate,
    },
  };
}
