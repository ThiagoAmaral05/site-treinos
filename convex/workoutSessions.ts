import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();

    if (!session) return null;

    // Get exercise details
    const exerciseDetails = await Promise.all(
      session.exercises.map(async (sessionExercise) => {
        const exercise = await ctx.db.get(sessionExercise.exerciseId);
        return {
          ...sessionExercise,
          exercise,
        };
      })
    );

    return {
      ...session,
      exercises: exerciseDetails,
    };
  },
});

export const getHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 30);

    return Promise.all(
      sessions.map(async (session) => {
        const exerciseDetails = await Promise.all(
          session.exercises.map(async (sessionExercise) => {
            const exercise = await ctx.db.get(sessionExercise.exerciseId);
            return {
              ...sessionExercise,
              exercise,
            };
          })
        );

        return {
          ...session,
          exercises: exerciseDetails,
        };
      })
    );
  },
});

export const getExerciseHistory = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const exerciseHistory = sessions
      .map((session) => {
        const exerciseData = session.exercises.find(
          (ex) => ex.exerciseId === args.exerciseId
        );
        if (!exerciseData) return null;

        return {
          date: session.date,
          sets: exerciseData.sets,
        };
      })
      .filter(Boolean);

    return exerciseHistory;
  },
});

export const save = mutation({
  args: {
    date: v.string(),
    duration: v.optional(v.number()),
    exercises: v.array(v.object({
      exerciseId: v.id("exercises"),
      sets: v.array(v.object({
        reps: v.number(),
        weight: v.number(),
        completed: v.boolean(),
      })),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if session already exists for this date
    const existingSession = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();

    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        duration: args.duration,
        exercises: args.exercises,
        notes: args.notes,
      });
      return existingSession._id;
    } else {
      // Create new session
      return await ctx.db.insert("workoutSessions", {
        ...args,
        userId,
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("workoutSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.id);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});