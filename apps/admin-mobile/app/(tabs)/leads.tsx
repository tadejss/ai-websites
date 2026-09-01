import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { LeadsPageResponse } from "@zbrendiraj/admin-api";
import { apiFetch, apiPost } from "@/src/api/client";
import { ErrorView, LoadingView } from "@/src/components/LoadingError";
import { PageHeader, StatCard, StatGrid } from "@/src/components/StatCard";
import { colors } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format";

const PIPELINES = [
  { value: "actionable", label: "All actionable" },
  { value: "never_viewed", label: "Never viewed" },
  { value: "customers", label: "Customers" },
  { value: "excluded", label: "Excluded" },
];

export default function LeadsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pipeline, setPipeline] = useState("actionable");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["leads", page, pipeline, search],
    queryFn: () =>
      apiFetch<LeadsPageResponse>(
        `/api/admin/leads?page=${page}&pageSize=50&pipeline=${pipeline}${search ? `&q=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  async function bulkSms() {
    if (selected.length === 0) return;
    await apiPost("/api/admin/outreach/sms/bulk-queue", { slugs: selected });
    setSelected([]);
    void refetch();
  }

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
        title="Leads"
        description={`${data.total} total · page ${data.page}/${data.totalPages}`}
      />

      <StatGrid>
        <StatCard label="Showing" value={String(data.rows.length)} />
        <StatCard label="Total" value={String(data.total)} />
      </StatGrid>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {PIPELINES.map((p) => (
          <Pressable
            key={p.value}
            style={[styles.chip, pipeline === p.value && styles.chipActive]}
            onPress={() => { setPipeline(p.value); setPage(1); }}
          >
            <Text style={[styles.chipText, pipeline === p.value && styles.chipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={q}
          onChangeText={setQ}
          placeholder="Search company, slug, phone…"
          placeholderTextColor={colors.muted}
          onSubmitEditing={() => { setSearch(q); setPage(1); }}
        />
        <Pressable style={styles.searchBtn} onPress={() => { setSearch(q); setPage(1); }}>
          <Text style={styles.searchBtnText}>Go</Text>
        </Pressable>
      </View>

      {selected.length > 0 ? (
        <Pressable style={styles.bulkBtn} onPress={() => void bulkSms()}>
          <Text style={styles.bulkBtnText}>Bulk SMS ({selected.length})</Text>
        </Pressable>
      ) : null}

      {data.rows.map((row) => {
        const slug = row.lead.slug;
        const isSelected = selected.includes(slug);
        return (
          <Pressable
            key={slug}
            style={styles.row}
            onPress={() => router.push(`/entity/${slug}`)}
            onLongPress={() =>
              setSelected((prev) =>
                prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
              )
            }
          >
            <View style={styles.rowHeader}>
              <Text style={styles.company}>{row.lead.companyName ?? slug}</Text>
              {isSelected ? <Text style={styles.selected}>✓</Text> : null}
            </View>
            <Text style={styles.meta}>
              {row.displayStatus} · views {row.lifecycle?.viewCount ?? "—"}
              {row.isNeverViewed ? " · never viewed" : ""}
            </Text>
            <Text style={styles.meta}>
              {row.demoAgeDays != null ? `${row.demoAgeDays}d old` : ""}
              {row.lifecycle?.lastViewedAt
                ? ` · last ${formatDate(row.lifecycle.lastViewedAt)}`
                : ""}
            </Text>
          </Pressable>
        );
      })}

      <View style={styles.pagination}>
        <Pressable
          disabled={page <= 1}
          onPress={() => setPage((p) => p - 1)}
          style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
        >
          <Text style={styles.pageBtnText}>← Previous</Text>
        </Pressable>
        <Text style={styles.pageInfo}>{data.page} / {data.totalPages}</Text>
        <Pressable
          disabled={page >= data.totalPages}
          onPress={() => setPage((p) => p + 1)}
          style={[styles.pageBtn, page >= data.totalPages && styles.pageBtnDisabled]}
        >
          <Text style={styles.pageBtnText}>Next →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  filters: { marginBottom: 12, maxHeight: 40 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.cyan, backgroundColor: colors.surfaceElevated },
  chipText: { color: colors.muted, fontSize: 12 },
  chipTextActive: { color: colors.cyan },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.foreground,
    padding: 10,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchBtnText: { color: colors.cyan, fontWeight: "600" },
  bulkBtn: {
    backgroundColor: colors.emerald,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  bulkBtnText: { color: colors.bg, fontWeight: "700" },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between" },
  company: { color: colors.cyan, fontSize: 15, fontWeight: "600" },
  selected: { color: colors.emerald, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.3 },
  pageBtnText: { color: colors.cyan, fontSize: 14 },
  pageInfo: { color: colors.muted, fontSize: 13 },
});
