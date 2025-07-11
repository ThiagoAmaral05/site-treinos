import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("workoutPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("workoutPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const plan = await ctx.db.get(args.id);
    if (!plan || plan.userId !== userId) return null;

    // Get exercise details for each exercise in the plan
    const exerciseDetails = await Promise.all(
      plan.exercises.map(async (planExercise) => {
        const exercise = await ctx.db.get(planExercise.exerciseId);
        return {
          ...planExercise,
          exercise,
        };
      })
    );

    return {
      ...plan,
      exercises: exerciseDetails,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    exercises: v.array(v.object({
      exerciseId: v.id("exercises"),
      dayOfWeek: v.string(),
      sets: v.number(),
      reps: v.string(),
      weight: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("workoutPlans", {
      ...args,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("workoutPlans"),
    name: v.string(),
    exercises: v.array(v.object({
      exerciseId: v.id("exercises"),
      dayOfWeek: v.string(),
      sets: v.number(),
      reps: v.string(),
      weight: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("workoutPlans") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});
