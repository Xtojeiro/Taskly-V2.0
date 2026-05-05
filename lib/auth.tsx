import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";
import { Platform } from "react-native";
import { useMutation } from "convex/react";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/convex/_generated/api";

const SESSION_KEY = "taskly-session-token";

const sessionStorage = {
  async getItem() {
    if (Platform.OS === "web") {
      return globalThis.localStorage?.getItem(SESSION_KEY) ?? null;
    }

    return await SecureStore.getItemAsync(SESSION_KEY);
  },
  async setItem(value: string) {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(SESSION_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(SESSION_KEY, value);
  },
  async deleteItem() {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(SESSION_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};

type PublicUser = {
  id: string;
  name: string;
  email: string;
  focusColor: string | null;
  language: "pt-PT" | "en-US";
  theme: "light" | "dark" | "system";
  goals: string[];
  targetPerWeek: number | null;
};

type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  goals: string[];
  targetPerWeek: number;
  systemLanguage: "pt-PT" | "en-US";
  focusColor?: string;
};

type AuthContextValue = {
  loading: boolean;
  sessionToken: string | null;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);

  const loginMutation = useMutation(api.auth.login);
  const signUpMutation = useMutation(api.auth.signUp);
  const resumeMutation = useMutation(api.auth.resume);
  const logoutMutation = useMutation(api.auth.logout);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedToken = await sessionStorage.getItem();
      if (!storedToken) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const restoredUser = await resumeMutation({ sessionToken: storedToken });
        if (!mounted) {
          return;
        }

        if (restoredUser) {
          setSessionToken(storedToken);
          setUser(restoredUser);
        } else {
          await sessionStorage.deleteItem();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, [resumeMutation]);

  const saveSession = useCallback(async (token: string, nextUser: PublicUser) => {
    await sessionStorage.setItem(token);
    setSessionToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password });
      await saveSession(result.sessionToken, result.user);
    },
    [loginMutation, saveSession],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const result = await signUpMutation(input);
      await saveSession(result.sessionToken, result.user);
    },
    [saveSession, signUpMutation],
  );

  const signOut = useCallback(async () => {
    const token = sessionToken;
    setSessionToken(null);
    setUser(null);
    await sessionStorage.deleteItem();
    if (token) {
      await logoutMutation({ sessionToken: token });
    }
  }, [logoutMutation, sessionToken]);

  const value = useMemo(
    () => ({ loading, sessionToken, user, login, signUp, signOut }),
    [loading, login, sessionToken, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}

export function AuthGate({ children }: PropsWithChildren) {
  const { loading, sessionToken } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    if (!sessionToken && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (sessionToken && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [loading, router, segments, sessionToken]);

  return <>{children}</>;
}
