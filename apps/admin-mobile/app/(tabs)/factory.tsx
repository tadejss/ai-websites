import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { FactorySnapshot } from "@zbrendiraj/admin-api";
import { apiFetch, apiPost } from "@/src/api/client";
import { ErrorView, LoadingView } from "@/src/components/LoadingError";
import { PageHeader, StatCard, StatGrid } from "@/src/components/StatCard";
import { colors } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format";

export default function FactoryScreen() {
  const router = useRouter();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["factory"],
    queryFn: () => apiFetch<FactorySnapshot>("/api/admin/factory"),
  });

  async function dispatch() {
    const result = await apiPost<{ dispatched?: boolean; reason?: string }>(
      "/api/admin/factory/dispatch",
    );
    setActionMsg(result.dispatched ? "Worker dispatched" : (result.reason ?? "Not dispatched"));
    void refetch();
  }

  async function cleanup() {
    const result = await apiPost<{ removed?: number }>("/api/admin/factory/cleanup-locks");
    setActionMsg(`Removed ${result.removed ?? 0} stale locks`);
    void refetch();
  }

  if (isLoading) return <LoadingView />;
  if (error || !data) {
    return <ErrorView message={error instanceof Error ? error.message : "Failed to load"} />;
  }

  const healthColor =
    data.health.level === "ok"
      ? colors.emerald
      : data.health.level === "warning"
        ? colors.amber
        : colors.red;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.cyan} />
      }
    >
      <PageHeader
        title="Factory Live Ops"
        description={`Snapshot ${formatDate(data.fetchedAt)}`}
      />

      <View style={[styles.healthBadge, { borderColor: healthColor }]}>
        <Text style={[styles.healthText, { color: healthColor }]}>
          {data.health.level.toUpperCase()}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => void dispatch()}>
          <Text style={styles.actionBtnText}>Dispatch worker</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => void cleanup()}>
          <Text style={styles.actionBtnTextSecondary}>Cleanup stale locks</Text>
        </Pressable>
      </View>
      {actionMsg ? <Text style={styles.actionMsg}>{actionMsg}</Text> : null}

      {data.health.issues.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health issues</Text>
          {data.health.issues.map((issue) => (
            <View key={issue.code} style={styles.issue}>
              <Text style={styles.issueLevel}>{issue.level}</Text>
              <Text style={styles.issueMsg}>{issue.message}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <StatGrid>
        <StatCard label="Worker" value={data.worker.activeLease?.status ?? "idle"} />
        <StatCard
          label="Backlog"
          value={`${data.replenish.actionable}/${data.replenish.target}`}
          sub={`need ${data.replenish.needed}`}
        />
        <StatCard
          label="Failures"
          value={String(data.worker.consecutiveFailures)}
          sub={data.worker.circuitOpen ? "circuit open" : "ok"}
        />
        <StatCard label="Stale locks" value={String(data.generationLocks.staleGenerating)} />
      </StatGrid>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent runs</Text>
        {data.worker.recentRuns.length === 0 ? (
          <Text style={styles.empty}>No runs recorded</Text>
        ) : (
          data.worker.recentRuns.slice(0, 10).map((run) => (
            <View key={run.runId} style={styles.runRow}>
              <Text style={styles.runMeta}>{formatDate(run.startedAt)} · {run.status}</Text>
              <Text style={styles.runStats}>
                gen {run.demosGenerated} · pub {run.demosPublished} · fail {run.demosFailed}
              </Text>
              {run.error ? <Text style={styles.runError}>{run.error}</Text> : null}
            </View>
          ))
        )}
      </View>

      <StatGrid>
        <StatCard label="Waiting approval" value={String(data.customerPublish.waitingApproval)} />
        <StatCard label="Publish failed" value={String(data.customerPublish.publishFailed)} />
        <StatCard label="Publishing" value={String(data.customerPublish.publishing)} />
        <StatCard
          label="SMS today"
          value={`${data.sms.sentToday}/${data.sms.dailyLimit}`}
          sub={data.sms.gatewayConfigured ? "gateway online" : "gateway offline"}
        />
      </StatGrid>

      {data.customerPublish.publishFailedRows.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Failed publishes</Text>
          {data.customerPublish.publishFailedRows.map((row) => (
            <Pressable key={row.slug} onPress={() => router.push(`/entity/${row.slug}`)}>
              <Text style={styles.link}>{row.slug}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discovery</Text>
        <Text style={styles.meta}>
          {data.discovery.combinationsCompleted}/{data.discovery.combinationsTotal} cells ·{" "}
          {data.discovery.currentRegion} × {data.discovery.currentProfession}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  healthBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  healthText: { fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  actionBtn: {
    backgroundColor: colors.cyan,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: { color: colors.bg, fontWeight: "700", fontSize: 13 },
  actionBtnTextSecondary: { color: colors.foreground, fontWeight: "600", fontSize: 13 },
  actionMsg: { color: colors.emerald, fontSize: 12, marginBottom: 12 },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  issue: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  issueLevel: { color: colors.amber, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  issueMsg: { color: colors.foreground, fontSize: 13, marginTop: 4 },
  runRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  runMeta: { color: colors.foreground, fontSize: 12 },
  runStats: { color: colors.muted, fontSize: 11, marginTop: 2 },
  runError: { color: colors.red, fontSize: 11, marginTop: 2 },
  empty: { color: colors.muted, fontSize: 13 },
  link: { color: colors.cyan, fontSize: 14, marginBottom: 4 },
  meta: { color: colors.muted, fontSize: 13 },
});
