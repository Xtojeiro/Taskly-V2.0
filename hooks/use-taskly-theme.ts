import { useQuery } from "convex/react";
import { useMemo } from "react";

import {
  TasklyPalettes,
  TasklyShadows,
  type TasklyThemeName,
} from "@/constants/taskly-design";
import { api } from "@/convex/_generated/api";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/lib/auth";

type ThemePreference = "light" | "dark" | "system";

export function useTasklyTheme() {
  const systemScheme = useColorScheme();
  const { sessionToken, user } = useAuth();
  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");

  const preference: ThemePreference = userSettings?.theme ?? user?.theme ?? "system";
  const colorScheme: TasklyThemeName = preference === "system" ? (systemScheme ?? "light") : preference;

  return useMemo(
    () => ({
      preference,
      colorScheme,
      colors: TasklyPalettes[colorScheme],
      shadow: TasklyShadows[colorScheme],
    }),
    [colorScheme, preference],
  );
}
