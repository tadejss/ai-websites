import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { InboxItem } from "@zbrendiraj/admin-api";
import { colors } from "@/src/theme/tokens";
import { formatDate } from "@/src/utils/format";

export function InboxColumn({
  title,
  count,
  items,
  emptyMessage,
}: {
  title: string;
  count: number;
  items: InboxItem[];
  emptyMessage: string;
}) {
  const router = useRouter();

  return (
    <View style={styles.column}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.slug}
            style={styles.item}
            onPress={() => router.push(`/entity/${item.slug}`)}
          >
            <Text style={styles.company}>{item.companyName}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  badge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: colors.foreground, fontSize: 12 },
  empty: { color: colors.muted, fontSize: 12, textAlign: "center", padding: 16 },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.surfaceElevated,
  },
  company: { color: colors.foreground, fontSize: 14, fontWeight: "500" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  date: { color: colors.muted, fontSize: 10, marginTop: 4 },
});
