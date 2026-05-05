import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { TasklyLayout, type TasklyThemeColors } from "@/constants/taskly-design";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatLongDate, isoDate } from "@/lib/dates";
import { useAuth } from "@/lib/auth";
import { getWeekdayShortNames, useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

type ViewMode = "daily" | "weekly";

type HabitItem = {
  _id: Id<"habits">;
  name: string;
  category?: string;
  frequency: "daily" | "weekly" | "monthly";
  scheduledTime?: string;
  targetDays?: number[];
  completed: boolean;
};

export default function TodoScreen() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const today = isoDate();
  const viewModes = useMemo(
    () => [
      { value: "daily" as const, label: t("common.frequency.daily") },
      { value: "weekly" as const, label: t("common.frequency.weekly") },
    ],
    [t],
  );
  const weekdayNames = useMemo(() => getWeekdayShortNames(locale), [locale]);

  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");
  const habits = useQuery(
    api.habits.list,
    sessionToken ? { sessionToken, date: today, view: viewMode } : "skip",
  );
  const toggleHabit = useMutation(api.habits.toggleCompletion);
  const focusColor = userSettings?.focusColor ?? user?.focusColor ?? colors.blue;

  const activeCount = useMemo(() => habits?.filter((habit) => !habit.completed).length ?? 0, [habits]);

  const handleToggleHabit = async (habitId: Id<"habits">) => {
    if (!sessionToken) {
      return;
    }
    await toggleHabit({ sessionToken, habitId, date: today });
  };

  const renderHabitItem = ({ item }: { item: HabitItem }) => (
    <TouchableOpacity
      style={[styles.taskCard, item.completed && styles.taskCardDone]}
      onPress={() => handleToggleHabit(item._id)}
    >
      <View style={[styles.checkbox, item.completed && { backgroundColor: focusColor, borderColor: focusColor }]}>
        {item.completed ? <Text style={styles.checkmark}>{"\u2713"}</Text> : null}
      </View>
      <View style={styles.taskText}>
        <Text style={[styles.taskName, item.completed && styles.taskNameDone]}>{item.name}</Text>
        <Text style={styles.taskCategory}>{item.category ?? t("common.general")}</Text>
      </View>
      <View style={styles.taskMeta}>
        <Text style={[styles.frequencyPill, frequencyColor(item.frequency, colors)]}>
          {frequencyLabel(item, weekdayNames, t)}
        </Text>
        <Text style={styles.timeText}>{item.scheduledTime ?? t("common.allDay")}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("todo.title")}</Text>
          <Text style={styles.date}>{formatLongDate(today, locale)}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? "T").slice(0, 1)}</Text>
        </View>
      </View>

      <View style={styles.segmented}>
        {viewModes.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[styles.segment, viewMode === mode.value && styles.segmentSelected]}
            onPress={() => setViewMode(mode.value)}
          >
            <Text style={[styles.segmentText, viewMode === mode.value && styles.segmentTextSelected]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.addTaskButton, { backgroundColor: focusColor }]}
          onPress={() => router.push("/habit/create")}
        >
          <Text style={styles.addTaskIcon}>+</Text>
          <Text style={styles.addTaskText}>{t("common.add")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t("todo.activeTasks")}</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{activeCount}</Text>
          </View>
        </View>
        <Text style={styles.sortLabel}>{t("todo.sortByTime")}</Text>
      </View>

      <FlatList
        data={habits ?? []}
        renderItem={renderHabitItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("todo.emptyTitle")}</Text>
            <Text style={styles.emptySubtitle}>{t("todo.emptySubtitle")}</Text>
          </View>
        }
      />
    </View>
  );
}

function frequencyLabel(
  item: HabitItem,
  weekdayNames: string[],
  t: (key: "common.frequency.daily" | "common.frequency.weekly" | "common.frequency.monthly") => string,
) {
  if (item.frequency === "weekly" && item.targetDays?.length) {
    return item.targetDays.map((day) => weekdayNames[day] ?? "").join(", ");
  }
  return t(`common.frequency.${item.frequency}`);
}

function frequencyColor(frequency: HabitItem["frequency"], colors: TasklyThemeColors) {
  if (frequency === "weekly") {
    return { color: colors.coral, borderColor: colors.coralSoft, backgroundColor: colors.coralSoft };
  }
  if (frequency === "monthly") {
    return { color: colors.lilac, borderColor: `${colors.lilac}55`, backgroundColor: `${colors.lilac}22` };
  }
  return { color: colors.blue, borderColor: `${colors.blue}55`, backgroundColor: `${colors.blue}22` };
}

function createStyles(colors: TasklyThemeColors, shadow: { card: string; elevated: string }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    header: {
      padding: 24,
      paddingBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      color: colors.ink,
      fontSize: 38,
      fontWeight: "900",
    },
    date: {
      color: colors.slate,
      fontSize: 19,
      fontWeight: "700",
      marginTop: 6,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 25,
      backgroundColor: colors.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: colors.inverseText,
      fontSize: 24,
      fontWeight: "900",
    },
    segmented: {
      flexDirection: "row",
      marginHorizontal: 24,
      backgroundColor: colors.soft,
      borderRadius: 20,
      padding: 6,
      gap: 6,
    },
    segment: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
    },
    segmentSelected: {
      backgroundColor: colors.surface,
      boxShadow: shadow.card,
    },
    segmentText: {
      color: colors.slate,
      fontSize: 16,
      fontWeight: "800",
    },
    segmentTextSelected: {
      color: colors.ink,
    },
    addTaskButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    addTaskIcon: {
      color: colors.inverseText,
      fontSize: 22,
      lineHeight: 24,
      fontWeight: "700",
    },
    addTaskText: {
      color: colors.inverseText,
      fontSize: 15,
      fontWeight: "900",
    },
    sectionHeader: {
      marginTop: 28,
      marginHorizontal: 24,
      marginBottom: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 25,
      fontWeight: "900",
    },
    countPill: {
      minWidth: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: `${colors.blue}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      color: colors.blue,
      fontWeight: "900",
    },
    sortLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900",
    },
    list: {
      paddingHorizontal: 24,
      paddingBottom: TasklyLayout.floatingActionClearance,
    },
    taskCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    taskCardDone: {
      opacity: 0.55,
    },
    checkbox: {
      width: 34,
      height: 34,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 18,
    },
    checkmark: {
      color: colors.inverseText,
      fontSize: 20,
      fontWeight: "900",
    },
    taskText: {
      flex: 1,
    },
    taskName: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "800",
    },
    taskNameDone: {
      color: colors.slate,
      textDecorationLine: "line-through",
    },
    taskCategory: {
      color: colors.slate,
      fontSize: 15,
      marginTop: 5,
    },
    taskMeta: {
      alignItems: "flex-end",
      gap: 8,
    },
    frequencyPill: {
      overflow: "hidden",
      borderRadius: 9,
      borderWidth: 1,
      paddingHorizontal: 9,
      paddingVertical: 4,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "capitalize",
    },
    timeText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 36,
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
    },
  });
}
