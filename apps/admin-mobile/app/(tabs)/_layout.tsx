import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { HealthStrip } from "@/src/components/HealthStrip";
import { colors } from "@/src/theme/tokens";

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HealthStrip />
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.cyan,
          tabBarInactiveTintColor: colors.muted,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/search")}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="search" size={22} color={colors.cyan} />
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inbox",
            tabBarIcon: ({ color }) => (
              <Ionicons name="mail-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leads"
          options={{
            title: "Leads",
            tabBarIcon: ({ color }) => (
              <Ionicons name="list-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pipeline"
          options={{
            title: "Pipeline",
            tabBarIcon: ({ color }) => (
              <Ionicons name="git-branch-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="factory"
          options={{
            title: "Factory",
            tabBarIcon: ({ color }) => (
              <Ionicons name="cog-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="revenue"
          options={{
            title: "Revenue",
            tabBarIcon: ({ color }) => (
              <Ionicons name="trending-up-outline" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
