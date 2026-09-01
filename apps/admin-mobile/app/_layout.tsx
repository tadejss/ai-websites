import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { colors } from "@/src/theme/tokens";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000 },
  },
});

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.foreground,
    border: colors.border,
    primary: colors.cyan,
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inLogin = segments[0] === "login";
    if (!isAuthenticated && !inLogin) {
      router.replace("/login");
    } else if (isAuthenticated && inLogin) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, segments, router]);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <AuthGate>
            <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.foreground, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="entity/[slug]" options={{ title: "Entity" }} />
              <Stack.Screen name="search" options={{ presentation: "modal", title: "Search" }} />
            </Stack>
          </AuthGate>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
