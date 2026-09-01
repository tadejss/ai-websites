import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme/tokens";

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.cyan} />
    </View>
  );
}

export function ErrorView({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.error}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
  },
  error: { color: colors.red, fontSize: 14, textAlign: "center" },
});
