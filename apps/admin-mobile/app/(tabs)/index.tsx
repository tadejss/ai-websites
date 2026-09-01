import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import type { InboxResponse } from "@zbrendiraj/admin-api";
import { apiFetch } from "@/src/api/client";
import { InboxColumn } from "@/src/components/InboxColumn";
import { ErrorView, LoadingView } from "@/src/components/LoadingError";
import { PageHeader, StatCard, StatGrid } from "@/src/components/StatCard";
import { colors } from "@/src/theme/tokens";

export default function InboxScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["inbox"],
    queryFn: () => apiFetch<InboxResponse>("/api/admin/inbox"),
  });

  if (isLoading) return <LoadingView />;
  if (error || !data) {
    return <ErrorView message={error instanceof Error ? error.message : "Failed to load"} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.cyan} />
      }
    >
      <PageHeader title="Command Center" description="What needs action today" />

      <StatGrid>
        <StatCard label="Onboarding review" value={String(data.counts.onboardingReview)} />
        <StatCard label="Publish failed" value={String(data.counts.publishFailed)} />
        <StatCard label="SMS actionable" value={String(data.counts.smsActionable)} />
        <StatCard
          label="Replenish needed"
          value={String(data.replenish.needed)}
          sub={`${data.replenish.actionable}/${data.replenish.target} backlog`}
        />
      </StatGrid>

      <View style={styles.columns}>
        <InboxColumn
          title="Onboarding review"
          count={data.counts.onboardingReview}
          items={data.onboardingReview}
          emptyMessage="No onboarding waiting for review"
        />
        <InboxColumn
          title="Publish failed"
          count={data.counts.publishFailed}
          items={data.publishFailed}
          emptyMessage="No failed publishes"
        />
        <InboxColumn
          title="SMS actionable"
          count={data.counts.smsActionable}
          items={data.smsActionable}
          emptyMessage="No actionable SMS leads"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  columns: { gap: 12 },
});
