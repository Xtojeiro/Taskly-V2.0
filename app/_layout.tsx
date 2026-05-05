import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexProvider } from "convex/react";
import { useMemo } from "react";
import "react-native-reanimated";

import { AuthGate, AuthProvider } from "@/lib/auth";
import { convex } from "@/lib/convex";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppShell() {
  const { colorScheme, colors } = useTasklyTheme();
  const { t } = useI18n();
  const navigationTheme = useMemo(
    () => ({
      ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
      colors: {
        ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.blue,
        background: colors.paper,
        card: colors.surface,
        text: colors.ink,
        border: colors.line,
        notification: colors.coral,
      },
    }),
    [colorScheme, colors],
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="habit/create" options={{ presentation: "modal", title: t("app.newTask") }} />
        </Stack>
      </AuthGate>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <I18nProvider>
          <AppShell />
        </I18nProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
