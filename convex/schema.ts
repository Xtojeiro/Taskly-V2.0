import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    passwordHash: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    targetPerWeek: v.optional(v.number()),
    focusColor: v.optional(v.string()),
    language: v.optional(v.union(v.literal("pt-PT"), v.literal("en-US"))),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  tags: defineTable({
    userId: v.id("users"),
    name: v.string(),
    color: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_name", ["userId", "name"]),

  habits: defineTable({
    userId: v.union(v.id("users"), v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    targetDays: v.optional(v.array(v.number())),
    scheduledTime: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_isActive", ["userId", "isActive"]),

  habitLogs: defineTable({
    habitId: v.id("habits"),
    userId: v.union(v.id("users"), v.string()),
    date: v.string(),
    completed: v.boolean(),
    completionRate: v.number(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_habit", ["habitId"])
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_habitId_and_date", ["habitId", "date"]),

  dailyStats: defineTable({
    userId: v.union(v.id("users"), v.string()),
    date: v.string(),
    totalHabits: v.number(),
    completedHabits: v.number(),
    completionRate: v.number(),
    score: v.number(),
  })
    .index("by_userId_and_date", ["userId", "date"]),

  aiInsights: defineTable({
    userId: v.id("users"),
    language: v.optional(v.union(v.literal("pt-PT"), v.literal("en-US"))),
    summary: v.string(),
    suggestions: v.array(v.string()),
    model: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_userId_and_language_and_createdAt", ["userId", "language", "createdAt"]),
});
