import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  exercises: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    muscleGroup: v.string(),
    imageId: v.optional(v.id("_storage")),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  workoutPlans: defineTable({
    name: v.string(),
    userId: v.id("users"),
    exercises: v.array(v.object({
      exerciseId: v.id("exercises"),
      dayOfWeek: v.string(), // "monday", "tuesday", etc.
      sets: v.number(),
      reps: v.string(), // "8-12" or "10"
      weight: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"]),

  workoutSessions: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    duration: v.optional(v.number()), // minutes
    exercises: v.array(v.object({
      exerciseId: v.id("exercises"),
      sets: v.array(v.object({
        reps: v.number(),
        weight: v.number(),
        completed: v.boolean(),
      })),
    })),
    notes: v.optional(v.string()),
  }).index("by_user_date", ["userId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
