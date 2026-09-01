import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View } from "react-native";
import type { HealthPayload } from "@zbrendiraj/admin-api";
import { apiFetch } from "@/src/api/client";
import { colors } from "@/src/theme/tokens";

function dotColor(level: string): string {
  switch (level) {
    case "ok":
      return colors.emerald;
    case "warning":
      return colors.amber;
    case "failed":
      return colors.red;
    default:
      return colors.muted;
  }
}

function StatusDot({ level, label, detail }: { level: string; label: string; detail: string }) {
  return (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: dotColor(level) }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

export function HealthStrip() {
  const { data } = useQuery({
    queryKey: ["health"],
    queryFn: () => apiFetch<HealthPayload>("/api/admin/health"),
    refetchInterval: 30_000,
  });

  if (!data) return null;

  return (
    <View style={styles.strip}>
      <StatusDot level={data.factory.level} label="Factory" detail={data.factory.detail} />
      <StatusDot level={data.sms.level} label="SMS" detail={data.sms.detail} />
      <StatusDot level={data.gateway.level} label="Gateway" detail={data.gateway.detail} />
      <StatusDot level={data.dispatch.level} label="Dispatch" detail={data.dispatch.detail} />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: colors.foreground, fontSize: 11, fontWeight: "600" },
  detail: { color: colors.muted, fontSize: 11 },
});
