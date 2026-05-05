/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function signUpTestUser() {
  const t = convexTest(schema, modules);
  const auth = await t.mutation(api.auth.signUp, {
    firstName: "Tomas",
    lastName: "Tojeiro",
    email: "tomas@example.com",
    password: "password123",
    goals: ["Build new habits"],
    targetPerWeek: 5,
    systemLanguage: "pt-PT",
  });

  return { t, sessionToken: auth.sessionToken };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Taskly Convex backend", () => {
  test("creates and resumes a local session", async () => {
    const { t, sessionToken } = await signUpTestUser();

    const user = await t.mutation(api.auth.resume, { sessionToken });
    expect(user?.email).toBe("tomas@example.com");
    expect(user?.language).toBe("pt-PT");

    await t.mutation(api.auth.logout, { sessionToken });
    const loggedOut = await t.mutation(api.auth.resume, { sessionToken });
    expect(loggedOut).toBeNull();
  });

  test("creates habits, toggles completion, and updates daily stats", async () => {
    const { t, sessionToken } = await signUpTestUser();
    const date = "2026-05-05";

    const habitId = await t.mutation(api.habits.create, {
      sessionToken,
      name: "Morning Yoga",
      category: "Health",
      frequency: "daily",
      scheduledTime: "07:00",
    });

    let habits = await t.query(api.habits.list, { sessionToken, date, view: "daily" });
    expect(habits).toHaveLength(1);
    expect(habits[0].completed).toBe(false);

    await t.mutation(api.habits.toggleCompletion, { sessionToken, habitId, date });

    habits = await t.query(api.habits.list, { sessionToken, date, view: "daily" });
    expect(habits[0].completed).toBe(true);

    const stats = await t.query(api.habits.getTodayStats, { sessionToken, date });
    expect(stats?.totalHabits).toBe(1);
    expect(stats?.completedHabits).toBe(1);
    expect(stats?.completionRate).toBe(100);
    expect(stats?.score).toBe(105);
  });

  test("generates and stores OpenRouter insights with mocked fetch", async () => {
    const globalWithProcess = globalThis as unknown as {
      process?: { env: Record<string, string | undefined> };
    };
    globalWithProcess.process ??= { env: {} };
    globalWithProcess.process.env.OPENROUTER_API_KEY = "test-key";
    globalWithProcess.process.env.OPENROUTER_MODEL = "openrouter/gpt-oss-120b:free";
    globalWithProcess.process.env.OPENROUTER_APP_TITLE = "Taskly";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init) => {
        const body = JSON.parse(String((init as RequestInit).body)) as { model?: string };
        expect(body.model).toBe("openai/gpt-oss-120b:free");

        return new Response(
          JSON.stringify({
            model: "openai/gpt-oss-120b:free",
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "You are most consistent in the morning.",
                    suggestions: ["Keep yoga early.", "Move reading before dinner."],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        );
      }),
    );

    const { t, sessionToken } = await signUpTestUser();
    await t.mutation(api.habits.create, {
      sessionToken,
      name: "Read 20 pages",
      category: "Study",
      frequency: "daily",
    });

    const insight = await t.action(api.ai.generateInsights, { sessionToken });
    expect(insight.suggestions).toContain("Keep yoga early.");

    const latest = await t.query(api.ai.latestInsight, { sessionToken });
    expect(latest?.summary).toBe("You are most consistent in the morning.");
  });

  test("updates language through settings", async () => {
    const { t, sessionToken } = await signUpTestUser();

    await t.mutation(api.habits.updateSettings, {
      sessionToken,
      language: "en-US",
    });

    const settings = await t.query(api.habits.getUserSettings, { sessionToken });
    expect(settings.language).toBe("en-US");
  });

  test("returns only insights for the active user language", async () => {
    const globalWithProcess = globalThis as unknown as {
      process?: { env: Record<string, string | undefined> };
    };
    globalWithProcess.process ??= { env: {} };
    globalWithProcess.process.env.OPENROUTER_API_KEY = "test-key";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            model: "openai/test",
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "Bom progresso.",
                    suggestions: ["Continua."],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const { t, sessionToken } = await signUpTestUser();
    await t.action(api.ai.generateInsights, { sessionToken });

    await t.mutation(api.habits.updateSettings, {
      sessionToken,
      language: "en-US",
    });

    const latest = await t.query(api.ai.latestInsight, { sessionToken });
    expect(latest).toBeNull();
  });
});
