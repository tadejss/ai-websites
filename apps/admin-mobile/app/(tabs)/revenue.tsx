import { useQuery } from "@tanstack/react-query";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RevenueResponse } from "@zbrendiraj/admin-api";
import { apiFetch } from "@/src/api/client";
import { ErrorView, LoadingView } from "@/src/components/LoadingError";
import { PageHeader, StatCard, StatGrid } from "@/src/components/StatCard";
import { colors } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format";

export default function RevenueScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["revenue"],
    queryFn: () => apiFetch<RevenueResponse>("/api/admin/revenue?auditLimit=10"),
  });

  if (isLoading) return <LoadingView />;
  if (error || !data) {
    return <ErrorView message={error instanceof Error ? error.message : "Failed to load"} />;
  }

  const { analytics: a } = data;
  const upsellEntries = Object.entries(a.upsellCounts);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.cyan} />
      }
    >
      <PageHeader title="Revenue & Analytics" description="MRR, funnel, SMS metrics" />

      <StatGrid>
        <StatCard label="MRR" value={`€${a.mrrEur.toFixed(0)}`} sub={`ARR €${a.arrEur.toFixed(0)}`} />
        <StatCard
          label="Customers"
          value={String(a.customerCount)}
          sub={`${a.monthlyCount} mo · ${a.yearlyCount} yr`}
        />
        <StatCard
          label="Purchases (7d)"
          value={String(a.purchasesThisWeek)}
          sub={`${a.purchasesThisMonth} this month`}
        />
        <StatCard
          label="SMS reply rate"
          value={`${a.sms.replyRate}%`}
          sub={`${a.sms.replied}/${a.sms.sent} sent`}
        />
      </StatGrid>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversion funnel</Text>
        <View style={styles.funnelRow}>
          <FunnelMetric label="Published" value={a.funnel.published} />
          <FunnelMetric label="Viewed" value={a.funnel.viewed} />
          <FunnelMetric label="Purchased" value={a.funnel.purchased} />
          <FunnelMetric label="Live" value={a.funnel.live} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SMS metrics</Text>
        <View style={styles.funnelRow}>
          <FunnelMetric label="Sent" value={a.sms.sent} />
          <FunnelMetric label="Replied" value={a.sms.replied} />
          <FunnelMetric label="Opted out" value={a.sms.optedOut} />
          <FunnelMetric label="Reply rate" value={`${a.sms.replyRate}%`} />
        </View>
      </View>

      {upsellEntries.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upsell attach</Text>
          {upsellEntries.map(([type, count]) => (
            <View key={type} style={styles.upsellRow}>
              <Text style={styles.upsellType}>{type}</Text>
              <Text style={styles.upsellCount}>{String(count)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent admin actions</Text>
        {data.auditLogs.length === 0 ? (
          <Text style={styles.empty}>No audit log entries yet</Text>
        ) : (
          data.auditLogs.map((log) => (
            <View key={log.id} style={styles.auditRow}>
              <Text style={styles.auditAction}>{log.action}</Text>
              {log.slug ? <Text style={styles.auditSlug}>{log.slug}</Text> : null}
              <Text style={[styles.auditResult, log.result === "ok" ? styles.ok : styles.fail]}>
                {log.result}
              </Text>
              <Text style={styles.auditDate}>{formatDate(log.createdAt)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function FunnelMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: { color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 12 },
  funnelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: {
    flexBasis: "45%",
    flexGrow: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    padding: 10,
  },
  metricLabel: { color: colors.muted, fontSize: 11 },
  metricValue: { color: colors.foreground, fontSize: 18, fontWeight: "600", marginTop: 2 },
  upsellRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  upsellType: { color: colors.muted, fontSize: 13 },
  upsellCount: { color: colors.foreground, fontFamily: "SpaceMono", fontSize: 13 },
  auditRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  auditAction: { color: colors.foreground, fontFamily: "SpaceMono", fontSize: 12 },
  auditSlug: { color: colors.muted, fontSize: 12, marginTop: 2 },
  auditResult: { fontSize: 12, marginTop: 2, fontWeight: "600" },
  ok: { color: colors.emerald },
  fail: { color: colors.red },
  auditDate: { color: colors.muted, fontSize: 10, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13 },
});
