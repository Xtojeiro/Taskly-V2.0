import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function publicUser(user: Doc<"users">): PublicUser {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    focusColor: user.focusColor ?? null,
    language: user.language ?? "en-US",
    theme: user.theme ?? "system",
    goals: user.goals ?? [],
    targetPerWeek: user.targetPerWeek ?? null,
  };
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`taskly-local-auth:${password}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function createSession(ctx: MutationCtx, user: Doc<"users">) {
  const token = randomToken();
  const now = Date.now();

  await ctx.db.insert("sessions", {
    userId: user._id,
    token,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  });

  return { sessionToken: token, user: publicUser(user) };
}

async function userByEmail(ctx: MutationCtx, email: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", normalizeEmail(email)))
    .unique();
}

async function userBySession(ctx: MutationCtx, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return await ctx.db.get(session.userId);
}

export const signUp = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    password: v.string(),
    goals: v.array(v.string()),
    targetPerWeek: v.number(),
    systemLanguage: v.optional(v.union(v.literal("pt-PT"), v.literal("en-US"))),
    focusColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const existing = await userByEmail(ctx, email);

    if (existing) {
      throw new Error("This email is already registered.");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: fullName(args.firstName, args.lastName),
      email,
      tokenIdentifier: `local:${email}`,
      passwordHash: await hashPassword(args.password),
      goals: args.goals.slice(0, 8),
      targetPerWeek: Math.max(1, Math.min(7, Math.round(args.targetPerWeek))),
      focusColor: args.focusColor ?? "#2F9BFF",
      language: args.systemLanguage ?? "en-US",
      theme: "system",
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user.");
    }

    return await createSession(ctx, user);
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userByEmail(ctx, args.email);
    if (!user || !user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    if (user.passwordHash !== (await hashPassword(args.password))) {
      throw new Error("Invalid email or password.");
    }

    return await createSession(ctx, user);
  },
});

export const resume = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userBySession(ctx, args.sessionToken);
    return user ? publicUser(user) : null;
  },
});

export const logout = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return null;
  },
});
