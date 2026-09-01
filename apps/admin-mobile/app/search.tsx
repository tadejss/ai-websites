import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { SearchResult } from "@zbrendiraj/admin-api";
import { apiFetch } from "@/src/api/client";
import { colors } from "@/src/theme/tokens";
import { stageLabel } from "@/src/utils/format";

type SearchResponse = { results: SearchResult[] };

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () =>
      apiFetch<SearchResponse>(
        `/api/admin/leads?search=${encodeURIComponent(debounced)}`,
      ),
    enabled: debounced.length > 0,
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search slug, company, phone…"
        placeholderTextColor={colors.muted}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isFetching ? (
        <ActivityIndicator color={colors.cyan} style={{ marginTop: 16 }} />
      ) : null}

      {debounced.length > 0 && data?.results.length === 0 && !isFetching ? (
        <Text style={styles.empty}>No results</Text>
      ) : null}

      {data?.results.map((result) => (
        <Pressable
          key={result.slug}
          style={styles.result}
          onPress={() => {
            router.back();
            router.push(`/entity/${result.slug}`);
          }}
        >
          <Text style={styles.company}>{result.companyName}</Text>
          <Text style={styles.slug}>{result.slug}</Text>
          <Text style={styles.stage}>{stageLabel(result.stage)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.foreground,
    padding: 14,
    fontSize: 16,
  },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24, fontSize: 14 },
  result: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    backgroundColor: colors.surface,
  },
  company: { color: colors.foreground, fontSize: 15, fontWeight: "600" },
  slug: { color: colors.muted, fontSize: 12, fontFamily: "SpaceMono", marginTop: 2 },
  stage: { color: colors.cyan, fontSize: 11, marginTop: 4 },
});
