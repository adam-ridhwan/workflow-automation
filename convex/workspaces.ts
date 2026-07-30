import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const create = mutation({
  args: { name: v.string() },
  returns: v.id('workspaces'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError('You must be signed in to create a workspace.');
    }
    const name = args.name.trim();
    if (!name) {
      throw new ConvexError('Workspace name is required.');
    }
    return await ctx.db.insert('workspaces', { name, ownerId: userId });
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('workspaces'),
      _creationTime: v.number(),
      name: v.string(),
      ownerId: v.id('users'),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    return await ctx.db
      .query('workspaces')
      .withIndex('by_owner', (q) => q.eq('ownerId', userId))
      .collect();
  },
});
