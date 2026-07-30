import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from '../_generated/server';
import { requireMember } from './workspaces';

import type { Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';

const workflowValidator = v.object({
  _id: v.id('workflows'),
  createdAt: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  description: v.optional(v.string()),
  isPublished: v.boolean(),
  createdBy: v.id('users'),
  createdByName: v.string(),
});

export type Workflow = Infer<typeof workflowValidator>;

async function getMemberWorkspaceByName(ctx: QueryCtx, workspaceName: string) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  const workspace = await ctx.db
    .query('workspaces')
    .withIndex('name', (q) => q.eq('name', workspaceName))
    .unique();
  if (workspace === null) {
    return null;
  }
  const membership = await ctx.db
    .query('workspaceMembers')
    .withIndex('workspaceUser', (q) =>
      q.eq('workspaceId', workspace._id).eq('userId', userId)
    )
    .unique();
  if (membership === null) {
    return null;
  }
  return workspace;
}

export const list = query({
  args: { workspaceName: v.string() },
  returns: v.array(workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    const nameCache = new Map<Id<'users'>, string>();
    const result: Workflow[] = [];
    for (const row of rows) {
      let createdByName = nameCache.get(row.createdBy);
      if (createdByName === undefined) {
        const user = await ctx.db.get(row.createdBy);
        createdByName = user?.name ?? 'Unknown';
        nameCache.set(row.createdBy, createdByName);
      }
      const { _creationTime, ...fields } = row;
      result.push({ ...fields, createdAt: _creationTime, createdByName });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('name', (q) => q.eq('name', args.workspaceName))
      .unique();
    if (workspace === null) {
      throw new ConvexError('Workspace not found.');
    }
    const membership = await requireMember(ctx, workspace._id);

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Workflow name is required.');
    }
    const description = args.description?.trim();

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: description ? description : undefined,
      isPublished: false,
      createdBy: membership.userId,
    });
  },
});
