import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export type AuthedUser = Doc<"users">;

export async function requireUser(ctx: Ctx, sessionToken: string): Promise<AuthedUser> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", sessionToken))
    .unique();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Please sign in again.");
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}
