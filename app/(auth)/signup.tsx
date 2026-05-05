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

import { SignalMotif } from "@/components/signal-motif";
import { TasklyRadius, type TasklyThemeColors } from "@/constants/taskly-design";
import { useAuth } from "@/lib/auth";
import {
  getGoalOptions,
  getSystemLanguage,
  localizeBackendError,
  useI18n,
} from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const goalOptions = useMemo(() => getGoalOptions(locale), [locale]);
  const steps = useMemo(
    () => [
      { title: t("auth.signup.step1Title"), subtitle: t("auth.signup.step1Subtitle") },
      { title: t("auth.signup.step2Title"), subtitle: t("auth.signup.step2Subtitle") },
      { title: t("auth.signup.step3Title"), subtitle: t("auth.signup.step3Subtitle") },
      { title: t("auth.signup.step4Title"), subtitle: t("auth.signup.step4Subtitle") },
    ],
    [t],
  );
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetPerWeek, setTargetPerWeek] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal],
    );
  };

  const canProceed = () => {
    if (step === 0) {
      return firstName.trim().length > 1 && lastName.trim().length > 1;
    }
    if (step === 1) {
      return email.includes("@") && password.length >= 6;
    }
    if (step === 2) {
      return selectedGoals.length > 0;
    }
    return targetPerWeek >= 1 && targetPerWeek <= 7;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      return;
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        goals: selectedGoals.map((key) => goalOptions.find((goal) => goal.key === key)?.label ?? key),
        targetPerWeek,
        systemLanguage: getSystemLanguage(),
      });
      router.replace("/(tabs)");
    } catch (err) {
      setError(
        err instanceof Error
          ? localizeBackendError(locale, err.message, "auth.signup.error")
          : t("auth.signup.error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <>
          <Text style={styles.label}>{t("auth.signup.firstName")}</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Tomas"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
          <Text style={styles.label}>{t("auth.signup.lastName")}</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Tojeiro"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <Text style={styles.label}>{t("common.email")}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>{t("common.password")}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t("auth.signup.passwordPlaceholder")}
            placeholderTextColor={colors.muted}
            secureTextEntry
          />
        </>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.goalsGrid}>
          {goalOptions.map((goal) => (
            <TouchableOpacity
              key={goal.key}
              style={[styles.goalChip, selectedGoals.includes(goal.key) && styles.goalChipSelected]}
              onPress={() => toggleGoal(goal.key)}
            >
              <Text style={[styles.goalText, selectedGoals.includes(goal.key) && styles.goalTextSelected]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.frequencyPanel}>
        <Text style={styles.targetGhost}>{Math.max(1, targetPerWeek - 1)}</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setTargetPerWeek((value) => Math.max(1, value - 1))}
          >
            <Text style={styles.stepperText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.targetNumber}>{targetPerWeek}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setTargetPerWeek((value) => Math.min(7, value + 1))}
          >
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.targetGhost}>{Math.min(7, targetPerWeek + 1)}</Text>
        <Text style={styles.hint}>{t("auth.signup.hint", { count: targetPerWeek })}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 0 ? <SignalMotif scale={0.9} /> : null}

        <View style={styles.header}>
          <Text style={styles.stepCounter}>{t("auth.signup.stepCounter", { current: step + 1, total: steps.length })}</Text>
          <Text style={styles.stepTitle}>{steps[step].title}</Text>
          <Text style={styles.stepSubtitle}>{steps[step].subtitle}</Text>
        </View>

        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, index <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        <View style={styles.form}>{renderStep()}</View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (step === 0 ? router.back() : setStep((current) => current - 1))}
          >
            <Text style={styles.backButtonText}>{step === 0 ? t("common.cancel") : t("common.back")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (!canProceed() || loading) && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || loading}
          >
            <Text style={styles.nextButtonText}>
              {step < steps.length - 1
                ? t("common.continue")
                : loading
                  ? t("auth.signup.creating")
                  : t("auth.signup.finishSetup")}
            </Text>
          </TouchableOpacity>
        </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 28,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.line,
  },
  progressDotActive: {
    width: 34,
    backgroundColor: colors.blue,
  },
  header: {
    alignItems: "flex-start",
    marginTop: 30,
    marginBottom: 28,
  },
  stepCounter: {
    color: colors.blueDark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 22,
  },
  stepTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.ink,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.slate,
    marginTop: 12,
    lineHeight: 24,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: TasklyRadius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
    boxShadow: shadow.card,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    color: colors.muted,
    marginBottom: 8,
    marginTop: 12,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: TasklyRadius.md,
    paddingHorizontal: 18,
    paddingVertical: 17,
    fontSize: 15,
    fontWeight: "700",
    color: colors.graphite,
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  goalChip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: "transparent",
  },
  goalChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  goalText: {
    fontSize: 14,
    color: colors.graphite,
    fontWeight: "800",
  },
  goalTextSelected: {
    color: colors.inverseText,
  },
  frequencyPanel: {
    alignItems: "center",
    paddingVertical: 16,
  },
  targetGhost: {
    fontSize: 24,
    color: colors.line,
    fontWeight: "800",
  },
  stepperRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  stepperButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    boxShadow: shadow.card,
  },
  stepperText: {
    fontSize: 32,
    color: colors.ink,
  },
  targetNumber: {
    fontSize: 76,
    fontWeight: "900",
    color: colors.blue,
  },
  hint: {
    color: colors.slate,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
    marginTop: 22,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.soft,
    borderRadius: TasklyRadius.md,
    padding: 16,
    alignItems: "center",
  },
  backButtonText: {
    color: colors.slate,
    fontSize: 16,
    fontWeight: "800",
  },
  nextButton: {
    flex: 2,
    backgroundColor: colors.blue,
    borderRadius: TasklyRadius.md,
    padding: 16,
    alignItems: "center",
    boxShadow: shadow.card,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.inverseText,
    fontSize: 16,
    fontWeight: "900",
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  });
}
