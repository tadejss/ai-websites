import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import type { AdminEntity } from "@zbrendiraj/admin-api";
import { apiPost } from "@/src/api/client";
import { colors } from "@/src/theme/tokens";

type Props = {
  entity: AdminEntity;
  onRefresh: () => void;
};

export function EntityActionBar({ entity, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(
    key: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    setLoading(key);
    setMessage(null);
    try {
      await fn();
      setMessage("OK");
      onRefresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  const buttons = [
    {
      key: "queue_sms",
      label: "Queue SMS",
      enabled: entity.actions.find((a) => a.kind === "queue_sms")?.enabled,
      onPress: () =>
        runAction("queue_sms", () =>
          apiPost("/api/admin/outreach/sms/queue", {
            slug: entity.slug,
            step: entity.smsDueStep ?? "initial",
          }),
        ),
    },
    {
      key: "retry_sms",
      label: "Retry SMS",
      enabled: entity.actions.find((a) => a.kind === "retry_sms")?.enabled,
      onPress: () =>
        runAction("retry_sms", () =>
          apiPost("/api/admin/outreach/sms/retry", entity.lastFailedMessageId
            ? { messageId: entity.lastFailedMessageId }
            : { slug: entity.slug, step: entity.smsDueStep ?? "initial" }),
        ),
    },
    {
      key: "approve",
      label: "Approve",
      enabled: entity.actions.find((a) => a.kind === "approve_onboarding")?.enabled,
      onPress: () =>
        runAction("approve", () =>
          apiPost(`/api/admin/onboarding/${entity.slug}/approve`),
        ),
    },
    {
      key: "retry_publish",
      label: "Retry publish",
      enabled: entity.actions.find((a) => a.kind === "retry_publish")?.enabled,
      onPress: () =>
        runAction("retry_publish", () =>
          apiPost(`/api/admin/onboarding/${entity.slug}/retry-publish`),
        ),
    },
    {
      key: "copy",
      label: "Copy onboarding",
      enabled: Boolean(entity.onboardingUrl),
      onPress: async () => {
        if (entity.onboardingUrl) {
          await Clipboard.setStringAsync(entity.onboardingUrl);
          setMessage("Copied");
        }
      },
    },
    {
      key: "demo",
      label: "Open demo",
      enabled: true,
      onPress: async () => {
        await WebBrowser.openBrowserAsync(entity.demoUrl);
      },
    },
  ];

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        {buttons
          .filter((b) => b.enabled)
          .map((btn) => (
            <Pressable
              key={btn.key}
              style={[styles.btn, loading === btn.key && styles.btnLoading]}
              onPress={() => void btn.onPress()}
              disabled={loading != null}
            >
              {loading === btn.key ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text style={styles.btnText}>{btn.label}</Text>
              )}
            </Pressable>
          ))}
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnLoading: { opacity: 0.7 },
  btnText: { color: colors.cyan, fontSize: 13, fontWeight: "500" },
  message: { color: colors.emerald, fontSize: 12, marginTop: 8 },
});
