import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { TasklyRadius, type TasklyThemeColors } from "@/constants/taskly-design";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { getCategoryOptions, getWeekdayInitials, useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

export default function CreateHabitScreen() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");
  const createHabit = useMutation(api.habits.create);
  const frequencies = useMemo(
    () => [
      { value: "daily" as const, label: t("common.frequency.daily"), description: t("common.frequency.dailyDescription") },
      { value: "weekly" as const, label: t("common.frequency.weekly"), description: t("common.frequency.weeklyDescription") },
      { value: "monthly" as const, label: t("common.frequency.monthly"), description: t("common.frequency.monthlyDescription") },
    ],
    [t],
  );
  const categoryOptions = useMemo(() => getCategoryOptions(locale), [locale]);
  const weekdayInitials = useMemo(() => getWeekdayInitials(locale), [locale]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryKey, setCategoryKey] = useState("health");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const focusColor = userSettings?.focusColor ?? user?.focusColor ?? colors.blue;

  const handleCreate = async () => {
    if (!sessionToken) {
      return;
    }
    if (!name.trim()) {
      setError(t("create.validation"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createHabit({
        sessionToken,
        name: name.trim(),
        description: description.trim() || undefined,
        category: categoryOptions.find((category) => category.key === categoryKey)?.label,
        frequency,
        targetDays: frequency === "daily" ? undefined : targetDays,
        scheduledTime: scheduledTime.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("create.error"));
    } finally {
      setLoading(false);
    }
  };

  const toggleTargetDay = (day: number) => {
    setTargetDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("create.title")}</Text>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: focusColor }]} onPress={handleCreate}>
            <Text style={styles.saveButtonText}>{loading ? "..." : t("common.save")}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.heroInput}
          value={name}
          onChangeText={setName}
          placeholder={t("create.heroPlaceholder")}
          placeholderTextColor={colors.muted}
          multiline
          autoFocus
        />

        <View style={styles.tagRow}>
          {categoryOptions.map((tag) => (
            <TouchableOpacity
              key={tag.key}
              style={[styles.tagChip, categoryKey === tag.key && { backgroundColor: `${focusColor}22` }]}
              onPress={() => setCategoryKey(tag.key)}
            >
              <Text style={[styles.tagText, categoryKey === tag.key && { color: focusColor }]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t("create.schedule")}</Text>
        <View style={styles.segmented}>
          {frequencies.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.segment, frequency === item.value && styles.segmentSelected]}
              onPress={() => setFrequency(item.value)}
            >
              <Text style={[styles.segmentText, frequency === item.value && styles.segmentTextSelected]}>
                {item.label}
              </Text>
              <Text style={styles.segmentSubtext}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequency !== "daily" ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("create.repeatsOn")}</Text>
            <View style={styles.dayRow}>
              {weekdayInitials.map((day, index) => (
                <TouchableOpacity
                  key={`${day}-${index}`}
                  style={[
                    styles.dayButton,
                    targetDays.includes(index) && { backgroundColor: focusColor, borderColor: focusColor },
                  ]}
                  onPress={() => toggleTargetDay(index)}
                >
                  <Text style={[styles.dayText, targetDays.includes(index) && styles.dayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("create.time")}</Text>
          <TextInput
            style={styles.input}
            value={scheduledTime}
            onChangeText={setScheduledTime}
            placeholder="09:00"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("create.notes")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t("create.notesPlaceholder")}
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: focusColor }, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>{loading ? t("create.creating") : t("create.createTask")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: TasklyThemeColors, shadow: { card: string; elevated: string }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      flexGrow: 1,
      padding: 24,
    },
    handle: {
      width: 76,
      height: 7,
      borderRadius: 999,
      backgroundColor: colors.line,
      alignSelf: "center",
      marginBottom: 28,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 28,
    },
    cancelButton: {
      color: colors.slate,
      fontSize: 18,
      fontWeight: "700",
    },
    title: {
      color: colors.ink,
      fontSize: 22,
      fontWeight: "900",
    },
    saveButton: {
      borderRadius: 22,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    saveButtonText: {
      color: colors.inverseText,
      fontSize: 16,
      fontWeight: "900",
    },
    heroInput: {
      color: colors.ink,
      fontSize: 38,
      fontWeight: "900",
      minHeight: 120,
      textAlignVertical: "top",
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 30,
    },
    tagChip: {
      backgroundColor: colors.soft,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    tagText: {
      color: colors.graphite,
      fontSize: 15,
      fontWeight: "800",
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 25,
      fontWeight: "900",
      marginBottom: 16,
    },
    segmented: {
      backgroundColor: colors.soft,
      borderRadius: 22,
      padding: 6,
      gap: 6,
      marginBottom: 24,
    },
    segment: {
      backgroundColor: "transparent",
      borderRadius: 18,
      padding: 14,
    },
    segmentSelected: {
      backgroundColor: colors.surface,
      boxShadow: shadow.card,
    },
    segmentText: {
      color: colors.slate,
      fontSize: 17,
      fontWeight: "900",
    },
    segmentTextSelected: {
      color: colors.ink,
    },
    segmentSubtext: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 3,
    },
    inputGroup: {
      marginBottom: 22,
    },
    label: {
      color: colors.slate,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 1.5,
      marginBottom: 10,
      textTransform: "uppercase",
    },
    dayRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.soft,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
    },
    dayText: {
      color: colors.slate,
      fontWeight: "900",
    },
    dayTextSelected: {
      color: colors.inverseText,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: TasklyRadius.md,
      padding: 16,
      color: colors.ink,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.line,
    },
    textArea: {
      minHeight: 96,
      textAlignVertical: "top",
    },
    error: {
      color: colors.danger,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 14,
    },
    createButton: {
      borderRadius: TasklyRadius.md,
      paddingVertical: 17,
      alignItems: "center",
      marginTop: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      color: colors.inverseText,
      fontSize: 17,
      fontWeight: "900",
    },
  });
}
