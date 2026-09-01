import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PipelineColumn } from "@zbrendiraj/admin-api";
import { apiFetch } from "@/src/api/client";
import { ErrorView, LoadingView } from "@/src/components/LoadingError";
import { PageHeader } from "@/src/components/StatCard";
import { colors } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format";

type PipelineResponse = { columns: PipelineColumn[] };

export default function PipelineScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["pipeline"],
    queryFn: () => apiFetch<PipelineResponse>("/api/admin/pipeline"),
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
      <PageHeader
        title="Onboarding Pipeline"
        description="Customer onboarding kanban"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {data.columns.map((column) => (
          <View key={column.status} style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>{column.label}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{column.cards.length}</Text>
              </View>
            </View>
            {column.cards.length === 0 ? (
              <Text style={styles.empty}>Empty</Text>
            ) : (
              column.cards.map((card) => (
                <Pressable
                  key={card.slug}
                  style={styles.card}
                  onPress={() => router.push(`/entity/${card.slug}`)}
                >
                  <Text style={styles.cardTitle}>{card.companyName}</Text>
                  <Text style={styles.cardSlug}>{card.slug}</Text>
                  <Text style={styles.cardDate}>{formatDate(card.updatedAt)}</Text>
                </Pressable>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  column: {
    width: 220,
    marginRight: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    minHeight: 200,
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  columnTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    flex: 1,
  },
  badge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: colors.foreground, fontSize: 11 },
  empty: { color: colors.muted, fontSize: 11, textAlign: "center", padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: colors.surfaceElevated,
  },
  cardTitle: { color: colors.foreground, fontSize: 13, fontWeight: "500" },
  cardSlug: { color: colors.muted, fontSize: 10, fontFamily: "SpaceMono", marginTop: 2 },
  cardDate: { color: colors.muted, fontSize: 10, marginTop: 4 },
});
