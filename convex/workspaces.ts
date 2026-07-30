import { slugify } from '@/lib/slugify';
import {
  validateWorkspaceName,
  WORKSPACE_NAME_REQUIREMENTS,
} from '@/lib/validate-workspace-name';
import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from './_generated/server';

const workspaceValidator = v.object({
  _id: v.id('workspaces'),
  _creationTime: v.number(),
  name: v.string(),
  ownerId: v.id('users'),
});

export type Workspace = Infer<typeof workspaceValidator>;

export const create = mutation({
  args: { name: v.string() },
  returns: v.id('workspaces'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError('You must be signed in to create a workspace.');
    }
    const name = slugify(args.name);
    if (!validateWorkspaceName(name)) {
      throw new ConvexError(WORKSPACE_NAME_REQUIREMENTS);
    }
    const existing = await ctx.db
      .query('workspaces')
      .withIndex('by_owner_name', (q) =>
        q.eq('ownerId', userId).eq('name', name)
      )
      .unique();
    if (existing !== null) {
      throw new ConvexError('You already have a workspace with this name.');
    }
    return await ctx.db.insert('workspaces', { name, ownerId: userId });
  },
});

export const getByName = query({
  args: { name: v.string() },
  returns: v.union(v.null(), workspaceValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db
      .query('workspaces')
      .withIndex('by_owner_name', (q) =>
        q.eq('ownerId', userId).eq('name', args.name)
      )
      .unique();
  },
});

export const list = query({
  args: {},
  returns: v.array(workspaceValidator),
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
