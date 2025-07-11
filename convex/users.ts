import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return null;
      }
      const user = await ctx.db.get(userId);
      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },
});
