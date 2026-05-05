import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./lib/auth";

const sessionArgs = { sessionToken: v.string() };
const todayViewValidator = v.optional(
  v.union(v.literal("daily"), v.literal("weekly"), v.literal("range")),
);

type HabitWithStatus = Doc<"habits"> & {
  completed: boolean;
  logId: Id<"habitLogs"> | null;
};

function dayOfWeek(date: string) {
  return new Date(`${date}T12:00:00`).getDay();
}

function isHabitScheduledForDate(habit: Doc<"habits">, date: string, view?: "daily" | "weekly" | "range") {
  if (view === "weekly" || view === "range") {
    return true;
  }

  if (habit.frequency === "daily") {
    return true;
  }

  if (habit.frequency === "weekly") {
    const targetDays = habit.targetDays ?? [];
    return targetDays.length === 0 || targetDays.includes(dayOfWeek(date));
  }

  const monthDay = Number(date.slice(8, 10));
  const targetDays = habit.targetDays ?? [];
  return targetDays.length === 0 ? monthDay === 1 : targetDays.includes(monthDay);
}

async function activeHabitsForUser(ctx: MutationCtx, userId: Id<"users">) {
  return await ctx.db
    .query("habits")
    .withIndex("by_userId_and_isActive", (q) => q.eq("userId", userId).eq("isActive", true))
    .take(100);
}

async function recalculateDailyStats(ctx: MutationCtx, userId: Id<"users">, date: string) {
  const activeHabits = await activeHabitsForUser(ctx, userId);
  const scheduledHabits = activeHabits.filter((habit) => isHabitScheduledForDate(habit, date));
  const scheduledIds = new Set(scheduledHabits.map((habit) => habit._id));

  const logs = await ctx.db
    .query("habitLogs")
    .withIndex("by_userId_and_date", (q) => q.eq("userId", userId).eq("date", date))
    .take(100);

  const completedHabits = logs.filter(
    (log) => log.completed && scheduledIds.has(log.habitId),
  ).length;
  const totalHabits = scheduledHabits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const score = completionRate + completedHabits * 5;

  const existing = await ctx.db
    .query("dailyStats")
    .withIndex("by_userId_and_date", (q) => q.eq("userId", userId).eq("date", date))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      totalHabits,
      completedHabits,
      completionRate,
      score,
    });
  } else {
    await ctx.db.insert("dailyStats", {
      userId,
      date,
      totalHabits,
      completedHabits,
      completionRate,
      score,
    });
  }

  return { totalHabits, completedHabits, completionRate, score };
}

export const list = query({
  args: {
    ...sessionArgs,
    date: v.optional(v.string()),
    view: todayViewValidator,
  },
  handler: async (ctx, args): Promise<HabitWithStatus[]> => {
    const user = await requireUser(ctx, args.sessionToken);
    const date = args.date ?? new Date().toISOString().slice(0, 10);

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_userId_and_isActive", (q) => q.eq("userId", user._id).eq("isActive", true))
      .take(100);

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id).eq("date", date))
      .take(100);
    const logsByHabit = new Map(logs.map((log) => [log.habitId, log]));

    return habits
      .filter((habit) => isHabitScheduledForDate(habit, date, args.view))
      .sort((a, b) => (a.scheduledTime ?? "99:99").localeCompare(b.scheduledTime ?? "99:99"))
      .map((habit) => {
        const log = logsByHabit.get(habit._id);
        return {
          ...habit,
          completed: log?.completed ?? false,
          logId: log?._id ?? null,
        };
      });
  },
});

export const getById = query({
  args: { ...sessionArgs, habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habit = await ctx.db.get(args.habitId);
    return habit && habit.userId === user._id ? habit : null;
  },
});

export const getLogs = query({
  args: {
    ...sessionArgs,
    habitId: v.id("habits"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user._id) {
      return [];
    }

    return await ctx.db
      .query("habitLogs")
      .withIndex("by_habitId_and_date", (q) =>
        q.eq("habitId", args.habitId).gte("date", args.startDate).lte("date", args.endDate),
      )
      .take(100);
  },
});

export const getUserStats = query({
  args: {
    ...sessionArgs,
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    return await ctx.db
      .query("dailyStats")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user._id).gte("date", args.startDate).lte("date", args.endDate),
      )
      .take(370);
  },
});

export const getHeatmapData = query({
  args: {
    ...sessionArgs,
    year: v.number(),
    month: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const startMonth = String(args.month ?? 1).padStart(2, "0");
    const endMonth = String(args.month ?? 12).padStart(2, "0");
    const endDay = args.month ? new Date(args.year, args.month, 0).getDate() : 31;
    const startDate = `${args.year}-${startMonth}-01`;
    const endDate = `${args.year}-${endMonth}-${String(endDay).padStart(2, "0")}`;

    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate).lte("date", endDate),
      )
      .take(370);

    return stats.map((stat) => ({
      date: stat.date,
      completionRate: stat.completionRate,
      score: stat.score,
      totalHabits: stat.totalHabits,
      completedHabits: stat.completedHabits,
    }));
  },
});

export const getTodayStats = query({
  args: {
    ...sessionArgs,
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const date = args.date ?? new Date().toISOString().slice(0, 10);

    return await ctx.db
      .query("dailyStats")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id).eq("date", date))
      .unique();
  },
});

export const getDayDetails = query({
  args: {
    ...sessionArgs,
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_userId_and_isActive", (q) => q.eq("userId", user._id).eq("isActive", true))
      .take(100);
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id).eq("date", args.date))
      .take(100);
    const logsByHabit = new Map(logs.map((log) => [log.habitId, log]));

    return habits
      .filter((habit) => isHabitScheduledForDate(habit, args.date))
      .map((habit) => ({
        habitId: habit._id,
        name: habit.name,
        category: habit.category ?? null,
        scheduledTime: habit.scheduledTime ?? null,
        completed: logsByHabit.get(habit._id)?.completed ?? false,
      }));
  },
});

export const getUserSettings = query({
  args: sessionArgs,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    return {
      name: user.name,
      email: user.email,
      focusColor: user.focusColor ?? "#2F9BFF",
      language: user.language ?? "en-US",
      theme: user.theme ?? "system",
      goals: user.goals ?? [],
      targetPerWeek: user.targetPerWeek ?? null,
    };
  },
});

export const create = mutation({
  args: {
    ...sessionArgs,
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    targetDays: v.optional(v.array(v.number())),
    scheduledTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const now = Date.now();
    const habitId = await ctx.db.insert("habits", {
      userId: user._id,
      name: args.name.trim(),
      description: args.description?.trim() || undefined,
      category: args.category?.trim() || undefined,
      frequency: args.frequency,
      targetDays: args.targetDays?.slice(0, 31),
      scheduledTime: args.scheduledTime?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });

    await recalculateDailyStats(ctx, user._id, new Date().toISOString().slice(0, 10));
    return habitId;
  },
});

export const update = mutation({
  args: {
    ...sessionArgs,
    habitId: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    targetDays: v.optional(v.array(v.number())),
    scheduledTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user._id) {
      throw new Error("Habit not found.");
    }

    await ctx.db.patch(args.habitId, {
      ...(args.name !== undefined && { name: args.name.trim() }),
      ...(args.description !== undefined && { description: args.description.trim() || undefined }),
      ...(args.category !== undefined && { category: args.category.trim() || undefined }),
      ...(args.frequency !== undefined && { frequency: args.frequency }),
      ...(args.targetDays !== undefined && { targetDays: args.targetDays.slice(0, 31) }),
      ...(args.scheduledTime !== undefined && { scheduledTime: args.scheduledTime.trim() || undefined }),
      updatedAt: Date.now(),
    });
  },
});

export const deleteHabit = mutation({
  args: { ...sessionArgs, habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user._id) {
      throw new Error("Habit not found.");
    }

    await ctx.db.patch(args.habitId, { isActive: false, updatedAt: Date.now() });
    await recalculateDailyStats(ctx, user._id, new Date().toISOString().slice(0, 10));
  },
});

export const logHabitCompletion = mutation({
  args: {
    ...sessionArgs,
    habitId: v.id("habits"),
    date: v.string(),
    completed: v.boolean(),
    completionRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user._id) {
      throw new Error("Habit not found.");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_habitId_and_date", (q) => q.eq("habitId", args.habitId).eq("date", args.date))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        completionRate: args.completionRate ?? (args.completed ? 100 : 0),
        updatedAt: now,
      });
      await recalculateDailyStats(ctx, user._id, args.date);
      return existing._id;
    }

    const logId = await ctx.db.insert("habitLogs", {
      habitId: args.habitId,
      userId: user._id,
      date: args.date,
      completed: args.completed,
      completionRate: args.completionRate ?? (args.completed ? 100 : 0),
      createdAt: now,
      updatedAt: now,
    });

    await recalculateDailyStats(ctx, user._id, args.date);
    return logId;
  },
});

export const toggleCompletion = mutation({
  args: {
    ...sessionArgs,
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user._id) {
      throw new Error("Habit not found.");
    }

    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_habitId_and_date", (q) => q.eq("habitId", args.habitId).eq("date", args.date))
      .unique();
    const completed = !(existing?.completed ?? false);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed,
        completionRate: completed ? 100 : 0,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        userId: user._id,
        date: args.date,
        completed,
        completionRate: completed ? 100 : 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return await recalculateDailyStats(ctx, user._id, args.date);
  },
});

export const updateSettings = mutation({
  args: {
    ...sessionArgs,
    focusColor: v.optional(v.string()),
    language: v.optional(v.union(v.literal("pt-PT"), v.literal("en-US"))),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.sessionToken);

    await ctx.db.patch(user._id, {
      ...(args.focusColor !== undefined && { focusColor: args.focusColor }),
      ...(args.language !== undefined && { language: args.language }),
      ...(args.theme !== undefined && { theme: args.theme }),
      updatedAt: Date.now(),
    });
  },
});
