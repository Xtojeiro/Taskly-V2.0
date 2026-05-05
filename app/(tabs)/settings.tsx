import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { TasklyLayout, TasklyRadius, type TasklyThemeColors } from "@/constants/taskly-design";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { type AppLanguage, useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

const FOCUS_COLORS = [
  { value: "#2F9BFF", nameKey: "settings.color.sky" },
  { value: "#22C55E", nameKey: "settings.color.mint" },
  { value: "#F97316", nameKey: "settings.color.coral" },
  { value: "#EF4444", nameKey: "settings.color.red" },
  { value: "#8B5CF6", nameKey: "settings.color.violet" },
  { value: "#EC4899", nameKey: "settings.color.pink" },
  { value: "#06B6D4", nameKey: "settings.color.cyan" },
  { value: "#84CC16", nameKey: "settings.color.lime" },
] as const;

export default function SettingsScreen() {
  const { sessionToken, user, signOut } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, setPreferredLanguage, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");
  const updateSettings = useMutation(api.habits.updateSettings);
  const [focusColor, setFocusColor] = useState(userSettings?.focusColor ?? colors.blue);
  const [theme, setTheme] = useState<"system" | "light" | "dark">(userSettings?.theme ?? "system");
  const [language, setLanguage] = useState<AppLanguage>(userSettings?.language ?? user?.language ?? locale);
  const themes = useMemo(
    () => [
      { value: "system" as const, label: t("common.theme.system") },
      { value: "light" as const, label: t("common.theme.light") },
      { value: "dark" as const, label: t("common.theme.dark") },
    ],
    [t],
  );
  const languages = useMemo(
    () => [
      { value: "pt-PT" as const, label: t("common.language.portugueseLabel") },
      { value: "en-US" as const, label: t("common.language.englishLabel") },
    ],
    [t],
  );

  useEffect(() => {
    if (userSettings?.focusColor) {
      setFocusColor(userSettings.focusColor);
    }
    if (userSettings?.theme) {
      setTheme(userSettings.theme);
    }
    if (userSettings?.language) {
      setLanguage(userSettings.language);
    }
  }, [userSettings]);

  const handleColorChange = async (color: string) => {
    if (!sessionToken) {
      return;
    }
    setFocusColor(color);
    await updateSettings({ sessionToken, focusColor: color });
  };

  const handleThemeChange = async (newTheme: "system" | "light" | "dark") => {
    if (!sessionToken) {
      return;
    }
    setTheme(newTheme);
    await updateSettings({ sessionToken, theme: newTheme });
  };

  const handleLanguageChange = async (newLanguage: AppLanguage) => {
    if (!sessionToken) {
      return;
    }

    const previousLanguage = language;
    setLanguage(newLanguage);
    setPreferredLanguage(newLanguage);
    try {
      await updateSettings({ sessionToken, language: newLanguage });
    } catch {
      setLanguage(previousLanguage);
      setPreferredLanguage(previousLanguage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("settings.title")}</Text>
        <Text style={styles.subtitle}>{userSettings?.email ?? user?.email}</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={[styles.profileAvatar, { backgroundColor: focusColor }]}>
          <Text style={styles.profileAvatarText}>{(userSettings?.name ?? user?.name ?? "T").slice(0, 1)}</Text>
        </View>
        <View>
          <Text style={styles.profileName}>{userSettings?.name ?? user?.name ?? t("settings.defaultUser")}</Text>
          <Text style={styles.profileMeta}>{t("settings.profileMeta")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.focusColor")}</Text>
        <Text style={styles.sectionSubtitle}>{t("settings.focusColorSubtitle")}</Text>
        <View style={styles.colorGrid}>
          {FOCUS_COLORS.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorOption,
                { backgroundColor: color.value },
                focusColor === color.value && styles.colorOptionSelected,
              ]}
              onPress={() => handleColorChange(color.value)}
            >
              {focusColor === color.value ? <Text style={styles.checkmark}>{"\u2713"}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.colorName}>
          {t(FOCUS_COLORS.find((color) => color.value === focusColor)?.nameKey ?? "settings.color.sky")}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.theme")}</Text>
        <Text style={styles.sectionSubtitle}>{t("settings.themeSubtitle")}</Text>
        <View style={styles.themeOptions}>
          {themes.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.themeOption, theme === option.value && { borderColor: focusColor }]}
              onPress={() => handleThemeChange(option.value)}
            >
              <Text style={[styles.themeLabel, theme === option.value && { color: focusColor }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <Text style={styles.sectionSubtitle}>{t("settings.languageSubtitle")}</Text>
        <View style={styles.themeOptions}>
          {languages.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.themeOption, language === option.value && { borderColor: focusColor }]}
              onPress={() => handleLanguageChange(option.value)}
            >
              <Text style={[styles.themeLabel, language === option.value && { color: focusColor }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.account")}</Text>
        <Text style={styles.sectionSubtitle}>{t("settings.accountSubtitle")}</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>{t("settings.signOut")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Taskly v1.0.0</Text>
    </ScrollView>
  );
}

function createStyles(colors: TasklyThemeColors, shadow: { card: string; elevated: string }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      padding: 20,
      paddingBottom: TasklyLayout.tabBarClearance,
    },
    header: {
      marginBottom: 22,
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      fontWeight: "900",
    },
    subtitle: {
      color: colors.slate,
      fontSize: 15,
      marginTop: 6,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.lg,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    profileAvatar: {
      width: 56,
      height: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    profileAvatarText: {
      color: colors.inverseText,
      fontSize: 24,
      fontWeight: "900",
    },
    profileName: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
    },
    profileMeta: {
      color: colors.slate,
      fontSize: 13,
      marginTop: 4,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.lg,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
    },
    sectionSubtitle: {
      color: colors.slate,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
      marginBottom: 16,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 12,
    },
    colorOption: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    colorOptionSelected: {
      borderWidth: 3,
      borderColor: colors.ink,
    },
    checkmark: {
      color: colors.inverseText,
      fontSize: 20,
      fontWeight: "900",
    },
    colorName: {
      color: colors.slate,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
    themeOptions: {
      flexDirection: "row",
      gap: 10,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: "center",
    },
    themeLabel: {
      color: colors.slate,
      fontSize: 14,
      fontWeight: "900",
    },
    signOutButton: {
      paddingVertical: 14,
    },
    signOutText: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: "900",
    },
    footer: {
      color: colors.muted,
      fontSize: 12,
      textAlign: "center",
      marginTop: 14,
    },
  });
}
