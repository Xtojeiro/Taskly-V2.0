import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { TasklyLayout, TasklyRadius, type TasklyThemeColors } from "@/constants/taskly-design";
import { api } from "@/convex/_generated/api";
import { formatMonthTitle, formatShortDate, isoDate } from "@/lib/dates";
import { useAuth } from "@/lib/auth";
import { getWeekdayInitials, useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

type HeatmapDay = {
  date: string;
  completionRate: number;
  score: number;
  totalHabits: number;
  completedHabits: number;
};

export default function StatsScreen() {
  const { sessionToken, user } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(isoDate(now));

  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");
  const heatmapData = useQuery(
    api.habits.getHeatmapData,
    sessionToken ? { sessionToken, year: selectedYear, month: selectedMonth + 1 } : "skip",
  );
  const dayDetails = useQuery(api.habits.getDayDetails, sessionToken ? { sessionToken, date: selectedDate } : "skip");

  const focusColor = userSettings?.focusColor ?? user?.focusColor ?? colors.blue;
  const dataByDate = useMemo(
    () => new Map((heatmapData ?? []).map((day: HeatmapDay) => [day.date, day])),
    [heatmapData],
  );
  const selectedDay = dataByDate.get(selectedDate);
  const stats = useMemo(() => calculateStats(heatmapData ?? []), [heatmapData]);
  const selectedCompletion = selectedDay?.completionRate ?? 0;
  const weekdays = useMemo(() => getWeekdayInitials(locale), [locale]);

  const moveMonth = (delta: number) => {
    const next = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedYear(next.getFullYear());
    setSelectedMonth(next.getMonth());
    setSelectedDate(isoDate(next));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => moveMonth(-1)}>
          <Text style={styles.navButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{formatMonthTitle(selectedYear, selectedMonth, locale)}</Text>
          <Text style={styles.subtitle}>{t("stats.subtitle")}</Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={() => moveMonth(1)}>
          <Text style={styles.navButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.progressBlock}>
          <View>
            <Text style={styles.summaryLabel}>{t("stats.selectedDay")}</Text>
            <View style={styles.metricLine}>
              <Text style={styles.bigMetric}>{selectedCompletion}%</Text>
              <Text style={styles.bigMetricLabel}>{t("stats.complete")}</Text>
            </View>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: `${focusColor}22` }]}>
            <Text style={[styles.summaryBadgeText, { color: focusColor }]}>
              {selectedDay?.completedHabits ?? 0}/{selectedDay?.totalHabits ?? dayDetails?.length ?? 0}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${selectedCompletion}%`, backgroundColor: focusColor }]} />
        </View>
        <View style={styles.statsGrid}>
          <Metric value={`${stats.avgCompletion}%`} label={t("stats.avgCompletion")} color={focusColor} styles={styles} />
          <Metric value={String(stats.totalScore)} label={t("stats.totalPoints")} color={focusColor} styles={styles} />
          <Metric value={`${stats.bestDay}%`} label={t("stats.bestDay")} color={colors.coral} styles={styles} />
        </View>
      </View>

      <View style={styles.heatmapGrid}>
        {weekdays.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekdayLabel}>
            {day}
          </Text>
        ))}
        {renderHeatmap(selectedYear, selectedMonth, dataByDate, selectedDate, setSelectedDate, focusColor, colors, styles)}
      </View>

      <View style={styles.detailPanel}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderText}>
            <Text style={styles.detailTitle}>{formatShortDate(selectedDate, locale)}</Text>
            <Text style={styles.detailSubtitle}>
              {t("stats.detailSubtitle", {
                completed: selectedDay?.completedHabits ?? 0,
                total: selectedDay?.totalHabits ?? dayDetails?.length ?? 0,
              })}
            </Text>
          </View>
          <View style={[styles.detailIcon, { backgroundColor: `${focusColor}20` }]}>
            <Text style={[styles.detailIconText, { color: focusColor }]}>{selectedCompletion}%</Text>
          </View>
        </View>

        {dayDetails && dayDetails.length > 0 ? (
          dayDetails.map((habit) => (
            <View key={habit.habitId} style={[styles.detailTask, habit.completed && styles.detailTaskDone]}>
              <View style={[styles.detailCheck, habit.completed && { backgroundColor: focusColor, borderColor: focusColor }]}>
                {habit.completed ? <Text style={styles.detailCheckText}>{"\u2713"}</Text> : null}
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.detailTaskName, habit.completed && styles.detailTaskNameDone]}>{habit.name}</Text>
                <Text style={styles.detailTaskMeta}>{habit.scheduledTime ?? habit.category ?? t("common.anyTime")}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyDetail}>
            <Text style={styles.emptyDetailTitle}>{t("stats.emptyTitle")}</Text>
            <Text style={styles.emptyDetailText}>{t("stats.emptySubtitle")}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function renderHeatmap(
  year: number,
  month: number,
  dataByDate: Map<string, HeatmapDay>,
  selectedDate: string,
  setSelectedDate: (date: string) => void,
  focusColor: string,
  colors: TasklyThemeColors,
  styles: ReturnType<typeof createStyles>,
) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(<View key={`empty-${index}`} style={styles.daySlot} />);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const completionRate = dataByDate.get(date)?.completionRate ?? 0;
    const selected = selectedDate === date;
    cells.push(
      <View key={date} style={styles.daySlot}>
        <TouchableOpacity
          style={[
            styles.dayCell,
            { backgroundColor: getHeatmapColor(completionRate, focusColor, colors) },
            selected && { borderColor: focusColor, borderWidth: 2 },
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[styles.dayText, completionRate >= 75 && styles.dayTextStrong]}>{day}</Text>
        </TouchableOpacity>
      </View>,
    );
  }

  return cells;
}

function getHeatmapColor(completionRate: number, focusColor: string, colors: TasklyThemeColors) {
  if (completionRate <= 0) {
    return colors.soft;
  }
  if (completionRate < 35) {
    return `${colors.blue}33`;
  }
  if (completionRate < 70) {
    return `${colors.blue}88`;
  }
  return focusColor;
}

function calculateStats(data: HeatmapDay[]) {
  if (data.length === 0) {
    return { avgCompletion: 0, totalScore: 0, bestDay: 0 };
  }

  const totalCompletion = data.reduce((sum, day) => sum + day.completionRate, 0);
  const totalScore = data.reduce((sum, day) => sum + day.score, 0);
  const bestDay = data.reduce((best, day) => Math.max(best, day.completionRate), 0);
  return {
    avgCompletion: Math.round(totalCompletion / data.length),
    totalScore,
    bestDay,
  };
}

function Metric({
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
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
      paddingBottom: TasklyLayout.tabBarClearance,
      gap: 18,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    navButton: {
      width: 44,
      height: 44,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    navButtonText: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900",
    },
    titleBlock: {
      alignItems: "center",
      flex: 1,
      paddingHorizontal: 12,
    },
    title: {
      color: colors.ink,
      fontSize: 25,
      fontWeight: "900",
      textAlign: "center",
    },
    subtitle: {
      color: colors.slate,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 4,
    },
    heatmapGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.xl,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      boxShadow: shadow.card,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.xl,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 20,
      gap: 16,
      boxShadow: shadow.card,
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    weekdayLabel: {
      width: `${100 / 7}%`,
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 10,
    },
    daySlot: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      padding: 4,
    },
    dayCell: {
      flex: 1,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },
    dayText: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "700",
    },
    dayTextStrong: {
      color: colors.inverseText,
    },
    progressBlock: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
    },
    metricLine: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      marginTop: 6,
    },
    bigMetric: {
      color: colors.ink,
      fontSize: 48,
      fontWeight: "900",
    },
    bigMetricLabel: {
      color: colors.slate,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 9,
    },
    summaryBadge: {
      minWidth: 64,
      height: 48,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    summaryBadgeText: {
      fontSize: 16,
      fontWeight: "900",
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.line,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 10,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.md,
      paddingVertical: 16,
      paddingHorizontal: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    metricValue: {
      fontSize: 22,
      fontWeight: "900",
    },
    metricLabel: {
      color: colors.slate,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 6,
    },
    detailPanel: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.xl,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.line,
      boxShadow: shadow.card,
    },
    detailHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
      gap: 12,
    },
    detailHeaderText: {
      flex: 1,
    },
    detailTitle: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900",
    },
    detailSubtitle: {
      color: colors.slate,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 4,
    },
    detailIcon: {
      minWidth: 58,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    detailIconText: {
      fontSize: 16,
      fontWeight: "900",
    },
    detailTask: {
      backgroundColor: colors.soft,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    detailTaskDone: {
      opacity: 0.65,
    },
    detailCheck: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    detailCheckText: {
      color: colors.inverseText,
      fontSize: 18,
      fontWeight: "900",
    },
    detailText: {
      flex: 1,
    },
    detailTaskName: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "800",
    },
    detailTaskNameDone: {
      color: colors.slate,
      textDecorationLine: "line-through",
    },
    detailTaskMeta: {
      color: colors.muted,
      fontSize: 14,
      marginTop: 4,
    },
    emptyDetail: {
      backgroundColor: colors.soft,
      borderRadius: TasklyRadius.md,
      padding: 18,
    },
    emptyDetailTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: "900",
      textAlign: "center",
    },
    emptyDetailText: {
      color: colors.slate,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
      textAlign: "center",
    },
  });
}
