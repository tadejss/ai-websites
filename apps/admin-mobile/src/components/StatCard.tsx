import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme/tokens";

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={styles.value}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  card: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    minWidth: 140,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { color: colors.foreground, fontSize: 20, fontWeight: "600" },
  sub: { color: colors.muted, fontSize: 11, marginTop: 2 },
  header: { marginBottom: 16 },
  title: { color: colors.foreground, fontSize: 24, fontWeight: "600" },
  description: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
