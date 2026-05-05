import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./lib/auth";

type InsightContext = {
  userId: string;
  name: string;
  language: "pt-PT" | "en-US";
  goals: string[];
  habits: Array<{
    name: string;
    category: string;
    frequency: string;
    completedRecently: number;
  }>;
  stats: Array<{
    date: string;
    completionRate: number;
    score: number;
  }>;
};

type OpenRouterResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function envValue(name: string) {
  const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[name];
}

function openRouterModel() {
  const configuredModel = envValue("OPENROUTER_MODEL");
  if (configuredModel?.startsWith("openrouter/gpt-oss-120b")) {
    return configuredModel.replace("openrouter/gpt-oss-120b", "openai/gpt-oss-120b");
  }

  return configuredModel ?? "openrouter/auto";
}

function fallbackSummary(language: "pt-PT" | "en-US") {
  return language === "pt-PT"
    ? "Aqui tens algumas formas de melhorares a tua consistência."
    : "Here are a few ways to improve your consistency.";
}

function parseSuggestions(content: string, language: "pt-PT" | "en-US") {
  try {
    const parsed = JSON.parse(content) as { summary?: string; suggestions?: string[] };
    if (parsed.summary && Array.isArray(parsed.suggestions)) {
      return {
        summary: parsed.summary.slice(0, 500),
        suggestions: parsed.suggestions.slice(0, 4).map((item) => item.slice(0, 180)),
      };
    }
  } catch {
    // Fall back to line parsing below when a model returns prose.
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);

  return {
    summary: lines[0]?.slice(0, 500) ?? fallbackSummary(language),
    suggestions: lines.slice(1, 5),
  };
}

export const latestInsight = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const language = user.language ?? "en-US";
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_userId_and_language_and_createdAt", (q) =>
        q.eq("userId", user._id).eq("language", language),
      )
      .order("desc")
      .take(1);

    return insights[0] ?? null;
  },
});

export const generateInsights = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const apiKey = envValue("OPENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured in Convex.");
    }

    const context: InsightContext = await ctx.runQuery(internal.ai.loadInsightContext, {
      sessionToken: args.sessionToken,
    });
    const model = openRouterModel();
    const appTitle = envValue("OPENROUTER_APP_TITLE") ?? "Taskly";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-OpenRouter-Title": appTitle,
      },
      body: JSON.stringify({
        model,
        max_tokens: 450,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              `You are Taskly's habit coach. Reply in ${context.language}. Return only compact JSON with keys summary and suggestions. suggestions must contain 2 to 4 short, practical strings.`,
          },
          {
            role: "user",
            content: JSON.stringify(context),
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter request failed: ${response.status} ${body.slice(0, 160)}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter did not return insight content.");
    }

    const insight = parseSuggestions(content, context.language);
    await ctx.runMutation(internal.ai.storeInsight, {
      sessionToken: args.sessionToken,
      language: context.language,
      summary: insight.summary,
      suggestions: insight.suggestions,
      model: data.model ?? model,
    });

    return {
      ...insight,
      model: data.model ?? model,
    };
  },
});

export const loadInsightContext = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<InsightContext> => {
    const user = await requireUser(ctx, args.sessionToken);
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_userId_and_isActive", (q) => q.eq("userId", user._id).eq("isActive", true))
      .take(100);
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(14);
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(300);

    return {
      userId: user._id,
      name: user.name,
      language: user.language ?? "en-US",
      goals: user.goals ?? [],
      habits: habits.map((habit) => ({
        name: habit.name,
        category: habit.category ?? "",
        frequency: habit.frequency,
        completedRecently: logs.filter((log) => log.habitId === habit._id && log.completed).length,
      })),
      stats: stats
        .reverse()
        .map((stat) => ({
          date: stat.date,
          completionRate: stat.completionRate,
          score: stat.score,
        })),
    };
  },
});

export const storeInsight = internalMutation({
  args: {
    sessionToken: v.string(),
    language: v.union(v.literal("pt-PT"), v.literal("en-US")),
    summary: v.string(),
    suggestions: v.array(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    return await ctx.db.insert("aiInsights", {
      userId: user._id,
      language: args.language,
      summary: args.summary,
      suggestions: args.suggestions.slice(0, 4),
      model: args.model,
      createdAt: Date.now(),
    });
  },
});
