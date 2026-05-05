import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SignalMotif } from "@/components/signal-motif";
import { TasklyRadius, type TasklyThemeColors } from "@/constants/taskly-design";
import { useAuth } from "@/lib/auth";
import { localizeBackendError, useI18n } from "@/lib/i18n";
import { useTasklyTheme } from "@/hooks/use-taskly-theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, shadow } = useTasklyTheme();
  const { locale, t } = useI18n();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("auth.login.validation"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      setError(
        err instanceof Error
          ? localizeBackendError(locale, err.message, "auth.login.error")
          : t("auth.login.error"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topGlow} />
        <View style={styles.header}>
          <SignalMotif />
          <Text style={styles.title}>Taskly</Text>
          <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{t("auth.login.title")}</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("common.email")}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tomas@example.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("common.password")}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{t("auth.login.continue")}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.login.noAccount")} </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup" as any)}>
              <Text style={styles.link}>{t("auth.login.startSetup")}</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 74,
    paddingBottom: 36,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 310,
    backgroundColor: `${colors.blue}22`,
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 78,
  },
  title: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 34,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.slate,
    marginTop: 10,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: TasklyRadius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 28,
    boxShadow: shadow.card,
  },
  formTitle: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginBottom: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    color: colors.muted,
    marginBottom: 8,
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
  button: {
    backgroundColor: colors.ink,
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.inverseText,
    fontSize: 16,
    fontWeight: "900",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 34,
  },
  footerText: {
    color: colors.slate,
    fontSize: 14,
  },
  link: {
    color: colors.blueDark,
    fontSize: 14,
    fontWeight: "800",
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  });
}
