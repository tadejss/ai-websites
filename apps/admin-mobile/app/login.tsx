import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme/tokens";

export default function LoginScreen() {
  const { login } = useAuth();
  const [baseUrl, setBaseUrl] = useState("https://zbrendiraj.si");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await login(baseUrl.trim(), secret.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>Website Factory</Text>
        <Text style={styles.subtitle}>Ops Console · Mobile</Text>

        <Text style={styles.label}>Base URL</Text>
        <TextInput
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://zbrendiraj.si"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Admin secret</Text>
        <TextInput
          style={styles.input}
          value={secret}
          onChangeText={setSecret}
          secureTextEntry
          autoCapitalize="none"
          placeholder="ADMIN_SECRET"
          placeholderTextColor={colors.muted}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void handleLogin()}
          disabled={loading || !secret.trim()}
        >
          <Text style={styles.buttonText}>{loading ? "Signing in…" : "Sign in"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
  },
  brand: { color: colors.foreground, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 24 },
  label: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.foreground,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.cyan,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 15 },
  error: { color: colors.red, fontSize: 13, marginBottom: 8 },
});
