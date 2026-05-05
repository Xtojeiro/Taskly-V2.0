import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { TasklyLayout, TasklyRadius, type TasklyThemeColors } from "@/constants/taskly-design";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatLongDate, isoDate } from "@/lib/dates";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

type HabitItem = {
  _id: Id<"habits">;
  name: string;
  description?: string;
  category?: string;
  scheduledTime?: string;
  completed: boolean;
};

export default function HomeScreen() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const today = isoDate();

  const queryArgs = sessionToken ? { sessionToken, date: today } : "skip";
  const todayStats = useQuery(api.habits.getTodayStats, queryArgs);
  const habits = useQuery(api.habits.list, sessionToken ? { sessionToken, date: today, view: "daily" } : "skip");
  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");
  const latestInsight = useQuery(api.ai.latestInsight, sessionToken ? { sessionToken } : "skip");
  const toggleHabit = useMutation(api.habits.toggleCompletion);
  const generateInsights = useAction(api.ai.generateInsights);

  const focusColor = userSettings?.focusColor ?? user?.focusColor ?? colors.blue;
  const completedCount = todayStats?.completedHabits ?? 0;
  const totalCount = todayStats?.totalHabits ?? habits?.length ?? 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 650);
  };

  const handleToggle = async (habitId: Id<"habits">) => {
    if (!sessionToken) {
      return;
    }
    await toggleHabit({ sessionToken, habitId, date: today });
  };

  const handleGenerateInsights = async () => {
    if (!sessionToken) {
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      await generateInsights({ sessionToken });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : t("home.aiError"));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.topGlow} />

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? "T").slice(0, 1)}</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.monthTitle}>{formatLongDate(today, locale)}</Text>
          <Text style={styles.progressLabel}>{t("home.progressLabel")}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${focusColor}22` }]}>
          <Text style={[styles.statusPillText, { color: focusColor }]}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>{t("home.progressTitle")}</Text>
            <Text style={styles.heroTitle}>{completedCount} of {totalCount}</Text>
            <Text style={styles.heroSubtitle}>{t("home.habitsCompleted")}</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: `${focusColor}22` }]}>
            <Text style={[styles.heroBadgeText, { color: focusColor }]}>{Math.round(progress)}%</Text>
          </View>
        </View>

        <View style={styles.heroProgressTrack}>
          <View style={[styles.heroProgressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: focusColor }]} />
        </View>

        <View style={styles.statsRow}>
          <Stat value={String(bestStreak(habits ?? []))} label={t("home.streak")} color={colors.coral} styles={styles} />
          <Stat value={`${Math.round(progress)}%`} label={t("home.done")} color={focusColor} styles={styles} />
          <Stat value={String(todayStats?.score ?? 0)} label={t("home.points")} color={focusColor} styles={styles} />
        </View>
      </View>

      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiTitle}>{t("home.aiTitle")}</Text>
          <TouchableOpacity style={[styles.aiButton, { backgroundColor: focusColor }]} onPress={handleGenerateInsights}>
            <Text style={styles.aiButtonText}>{aiLoading ? t("home.aiThinking") : t("home.aiGenerate")}</Text>
          </TouchableOpacity>
        </View>
        {latestInsight ? (
          <>
            <Text style={styles.aiSummary}>{latestInsight.summary}</Text>
            {latestInsight.suggestions.map((suggestion, index) => (
              <Text key={`${suggestion}-${index}`} style={styles.aiSuggestion}>
                {index + 1}. {suggestion}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.aiSummary}>{t("home.aiEmpty")}</Text>
        )}
        {aiError ? <Text style={styles.aiError}>{aiError}</Text> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.sectionTitle")}</Text>
        <Text style={styles.sectionMeta}>{t("home.sectionMeta", { completed: completedCount, total: totalCount })}</Text>
      </View>

      {habits && habits.length > 0 ? (
        habits.map((habit: HabitItem) => (
          <TouchableOpacity
            key={habit._id}
            style={[styles.taskCard, habit.completed && styles.taskCardDone]}
            onPress={() => handleToggle(habit._id)}
          >
            <View style={[styles.checkbox, habit.completed && { backgroundColor: focusColor, borderColor: focusColor }]}>
              {habit.completed ? <Text style={styles.checkboxCheck}>{"\u2713"}</Text> : null}
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskName, habit.completed && styles.taskNameDone]}>{habit.name}</Text>
              <Text style={styles.taskMeta}>{habit.scheduledTime ?? habit.category ?? t("common.anyTime")}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t("home.emptyTitle")}</Text>
          <Text style={styles.emptySubtitle}>{t("home.emptySubtitle")}</Text>
          <TouchableOpacity style={[styles.createButton, { backgroundColor: focusColor }]} onPress={() => router.push("/habit/create")}>
            <Text style={styles.createButtonText}>{t("home.createTask")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: focusColor }]} onPress={() => router.push("/habit/create")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function bestStreak(habits: HabitItem[]) {
  return habits.filter((habit) => habit.completed).length;
}

function Stat({
  value,
  label,
  color,
  styles,
}: {
  value: string;
  label: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
      paddingBottom: TasklyLayout.floatingActionClearance,
      gap: 18,
    },
    topGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 210,
      backgroundColor: colors.mintSoft,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 18,
      backgroundColor: colors.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: colors.inverseText,
      fontWeight: "900",
      fontSize: 20,
    },
    headerCenter: {
      flex: 1,
      paddingHorizontal: 14,
    },
    monthTitle: {
      color: colors.ink,
      fontSize: 21,
      fontWeight: "900",
      textAlign: "center",
    },
    progressLabel: {
      marginTop: 3,
      color: colors.slate,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 2,
      textAlign: "center",
    },
    statusPill: {
      minWidth: 48,
      height: 44,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    statusPillText: {
      fontSize: 13,
      fontWeight: "900",
    },
    progressSection: {
      backgroundColor: colors.navy,
      borderRadius: TasklyRadius.xl,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 22,
      boxShadow: shadow.card,
    },
    progressHero: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
    },
    heroCopy: {
      flex: 1,
    },
    heroLabel: {
      color: "#A8B3C2",
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    heroTitle: {
      color: "#F8FAFC",
      fontSize: 34,
      fontWeight: "900",
      marginTop: 8,
    },
    heroSubtitle: {
      color: "#D7E3DC",
      fontSize: 15,
      fontWeight: "700",
      marginTop: 2,
    },
    heroBadge: {
      width: 92,
      height: 92,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    heroBadgeText: {
      fontSize: 27,
      fontWeight: "900",
    },
    heroProgressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      overflow: "hidden",
      marginTop: 20,
    },
    heroProgressFill: {
      height: "100%",
      borderRadius: 999,
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
      width: "100%",
      marginTop: 18,
    },
    statCard: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderRadius: TasklyRadius.md,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.11)",
    },
    statValue: {
      fontSize: 22,
      fontWeight: "900",
    },
    statLabel: {
      fontSize: 11,
      color: "#A8B3C2",
      fontWeight: "800",
      marginTop: 4,
    },
    aiCard: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.xl,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    aiHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    aiTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
    },
    aiButton: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    aiButtonText: {
      color: colors.inverseText,
      fontWeight: "900",
      fontSize: 12,
    },
    aiSummary: {
      color: colors.graphite,
      fontSize: 14,
      lineHeight: 21,
    },
    aiSuggestion: {
      color: colors.slate,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 6,
    },
    aiError: {
      color: colors.danger,
      fontSize: 12,
      marginTop: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 28,
      fontWeight: "900",
    },
    sectionMeta: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "700",
    },
    taskCard: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    taskCardDone: {
      opacity: 0.65,
    },
    checkbox: {
      width: 30,
      height: 30,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    checkboxCheck: {
      color: colors.inverseText,
      fontSize: 18,
      fontWeight: "900",
    },
    taskInfo: {
      flex: 1,
    },
    taskName: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "700",
    },
    taskNameDone: {
      color: colors.slate,
      textDecorationLine: "line-through",
    },
    taskMeta: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 4,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.xl,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
      padding: 28,
      alignItems: "center",
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "800",
    },
    emptySubtitle: {
      color: colors.slate,
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 18,
    },
    createButton: {
      borderRadius: TasklyRadius.md,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    createButtonText: {
      color: colors.inverseText,
      fontSize: 15,
      fontWeight: "800",
    },
    fab: {
      position: "absolute",
      right: 28,
      bottom: TasklyLayout.floatingActionBottom,
      width: 64,
      height: 64,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    fabText: {
      color: colors.inverseText,
      fontSize: 42,
      lineHeight: 46,
      fontWeight: "500",
    },
  });
}
