import { getAuthUserId } from '@convex-dev/auth/server';
import { Infer, v } from 'convex/values';

import { query } from '../_generated/server';

const userValidator = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  name: v.string(),
  image: v.optional(v.string()),
  email: v.string(),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
});

export type User = Infer<typeof userValidator>;

export const currentUser = query({
  args: {},
  returns: v.union(v.null(), userValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});
