import { isDatabaseConfigured, sql } from "@/db/client";
import { ensureCustomerSchema } from "@/db/ensure-schema";

export type MonthlyPoint = {
  month: string;
  label: string;
  value: number;
};

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
  customersPerMonth: MonthlyPoint[];
  earningsPerMonth: MonthlyPoint[];
};

const MONTHLY_PRICE = 35;
const YEARLY_PRICE = 350;

function lastTwelveMonths(): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  const now = new Date();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    points.push({
      month,
      label: date.toLocaleDateString("sl-SI", { month: "short" }),
      value: 0,
    });
  }
  return points;
}

function monthKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mergeMonthly(
  points: MonthlyPoint[],
  rows: Array<{ month: Date | string; value: number }>,
): MonthlyPoint[] {
  const byMonth = new Map(points.map((point) => [point.month, point.value]));
  for (const row of rows) {
    byMonth.set(monthKey(row.month), Number(row.value) || 0);
  }
  return points.map((point) => ({
    ...point,
    value: byMonth.get(point.month) ?? 0,
  }));
}

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
    customersPerMonth: lastTwelveMonths(),
    earningsPerMonth: lastTwelveMonths(),
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

  const months = lastTwelveMonths();
  const customerMonthRows = (await db`
    SELECT date_trunc('month', purchased_at) AS month, COUNT(*)::int AS value
    FROM customers
    WHERE purchased_at >= date_trunc('month', NOW() - INTERVAL '11 months')
    GROUP BY 1
    ORDER BY 1
  `) as Array<{ month: Date | string; value: number }>;

  const earningsMonthRows = (await db`
    SELECT
      date_trunc('month', p.purchased_at) AS month,
      SUM(
        CASE
          WHEN p.purchase_kind = 'base_subscription' AND c.subscription_plan = 'monthly' THEN ${MONTHLY_PRICE}
          WHEN p.purchase_kind = 'base_subscription' AND c.subscription_plan = 'yearly' THEN ${YEARLY_PRICE}
          WHEN p.upsell_type = 'google_business' THEN 39
          WHEN p.upsell_type = 'seo' THEN 29
          WHEN p.upsell_type = 'professional_email' THEN 5
          ELSE 0
        END
      )::float AS value
    FROM customer_purchases p
    JOIN customers c ON c.slug = p.slug
    WHERE p.purchased_at >= date_trunc('month', NOW() - INTERVAL '11 months')
    GROUP BY 1
    ORDER BY 1
  `) as Array<{ month: Date | string; value: number }>;

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
    customersPerMonth: mergeMonthly(months, customerMonthRows),
    earningsPerMonth: mergeMonthly(months, earningsMonthRows),
  };
}
