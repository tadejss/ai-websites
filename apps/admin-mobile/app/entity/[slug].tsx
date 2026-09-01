import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AdminEntity } from "@zbrendiraj/admin-api";
import { apiFetch } from "@/src/api/client";
import { EntityActionBar } from "@/src/components/EntityActionBar";
import { ErrorView, LoadingView } from "@/src/components/LoadingError";
import { colors } from "@/src/theme/tokens";
import { formatDate, stageLabel } from "@/src/utils/format";

export default function EntityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["entity", slug],
    queryFn: () => apiFetch<AdminEntity>(`/api/admin/entities/${slug}`),
    enabled: Boolean(slug),
  });

  if (isLoading) return <LoadingView />;
  if (error || !data) {
    return <ErrorView message={error instanceof Error ? error.message : "Not found"} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.cyan} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{data.companyName}</Text>
        <Text style={styles.subtitle}>
          {[data.industry, data.slug].filter(Boolean).join(" · ")}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{stageLabel(data.stage)}</Text>
        </View>
      </View>

      <EntityActionBar entity={data} onRefresh={() => void refetch()} />

      <Panel title="Timeline">
        {data.timeline.length === 0 ? (
          <Text style={styles.empty}>No events yet</Text>
        ) : (
          data.timeline.map((event) => (
            <View key={event.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineBody}>
                <Text style={styles.timelineLabel}>{event.label}</Text>
                <Text style={styles.timelineDate}>{formatDate(event.at)}</Text>
                {event.detail ? (
                  <Text style={styles.timelineDetail}>{event.detail}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </Panel>

      <Panel title="Substates">
        <StatRow label="Lead" value={data.substates.leadStatus} />
        <StatRow label="SMS" value={data.substates.smsStatus ?? "—"} />
        <StatRow label="Lifecycle" value={data.substates.lifecycleStatus ?? "—"} />
        <StatRow label="Onboarding" value={data.substates.onboardingStatus ?? "—"} />
      </Panel>

      {data.demoLifecycle ? (
        <Panel title="Demo lifecycle">
          <StatRow label="Views" value={String(data.demoLifecycle.viewCount)} />
          <StatRow label="Published" value={formatDate(data.demoLifecycle.publishedAt)} />
          <StatRow label="First view" value={formatDate(data.demoLifecycle.firstViewedAt)} />
          <StatRow label="Last view" value={formatDate(data.demoLifecycle.lastViewedAt)} />
        </Panel>
      ) : null}

      {data.smsMessages.length > 0 ? (
        <Panel title="SMS history">
          {data.smsMessages.map((msg) => (
            <View key={msg.messageId} style={styles.msgRow}>
              <Text style={styles.msgTitle}>{msg.step} · {msg.status}</Text>
              <Text style={styles.msgDate}>{formatDate(msg.sentAt ?? msg.createdAt)}</Text>
            </View>
          ))}
        </Panel>
      ) : null}

      {data.smsInbound.length > 0 ? (
        <Panel title="Inbound SMS">
          {data.smsInbound.map((msg) => (
            <View key={msg.id} style={styles.msgRow}>
              <Text style={styles.msgTitle}>{msg.isOptOut ? "Opt-out" : "Reply"}</Text>
              <Text style={styles.msgDetail}>{msg.body.slice(0, 120)}</Text>
              <Text style={styles.msgDate}>{formatDate(msg.receivedAt)}</Text>
            </View>
          ))}
        </Panel>
      ) : null}

      {data.onboarding ? (
        <Panel title="Onboarding">
          {data.onboarding.publishError ? (
            <Text style={styles.error}>{data.onboarding.publishError}</Text>
          ) : null}
          <StatRow label="Status" value={data.onboarding.status} />
          <StatRow label="Email" value={data.onboarding.contactEmail ?? data.onboarding.answers?.email ?? "—"} />
          <StatRow label="Submitted" value={formatDate(data.onboarding.submittedAt)} />
          {data.onboarding.images.length > 0 ? (
            <ScrollView horizontal style={styles.gallery}>
              {data.onboarding.images.map((img) => (
                <Image key={img.url} source={{ uri: img.url }} style={styles.thumb} />
              ))}
            </ScrollView>
          ) : null}
        </Panel>
      ) : null}

      {data.customer ? (
        <Panel title="Customer">
          <StatRow label="Plan" value={data.customer.subscriptionPlan ?? "—"} />
          <StatRow label="Purchased" value={formatDate(data.customer.purchasedAt)} />
        </Panel>
      ) : null}
    </ScrollView>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 8 },
  title: { color: colors.foreground, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: colors.cyan, fontSize: 11, fontWeight: "700" },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  panelTitle: { color: colors.foreground, fontSize: 14, fontWeight: "600", marginBottom: 10 },
  empty: { color: colors.muted, fontSize: 13 },
  timelineItem: { flexDirection: "row", marginBottom: 12 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
    marginTop: 4,
    marginRight: 10,
  },
  timelineBody: { flex: 1 },
  timelineLabel: { color: colors.foreground, fontSize: 14, fontWeight: "500" },
  timelineDate: { color: colors.muted, fontSize: 11, marginTop: 2 },
  timelineDetail: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  statLabel: { color: colors.muted, fontSize: 13 },
  statValue: { color: colors.foreground, fontSize: 12, fontFamily: "SpaceMono" },
  msgRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  msgTitle: { color: colors.foreground, fontSize: 13, fontWeight: "500" },
  msgDetail: { color: colors.muted, fontSize: 12, marginTop: 2 },
  msgDate: { color: colors.muted, fontSize: 10, marginTop: 4 },
  error: {
    color: colors.red,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    fontSize: 13,
  },
  gallery: { marginTop: 8 },
  thumb: { width: 80, height: 80, borderRadius: 6, marginRight: 8 },
});
