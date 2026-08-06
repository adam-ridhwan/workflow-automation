import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  getMemberWorkspaceByName,
  getWorkspaceByNameOrThrow,
  requireMember,
} from './workspaces';

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

const folderValidator = v.object({
  _id: v.id('folders'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  parentId: v.optional(v.id('folders')),
  createdBy: v.id('users'),
  createdByName: v.string(),
  createdByEmail: v.string(),
});

export type Folder = Infer<typeof folderValidator>;

async function getMemberFolder(
  ctx: MutationCtx,
  workspaceName: string,
  folderId: Id<'folders'>
) {
  const workspace = await getWorkspaceByNameOrThrow(ctx, workspaceName);
  await requireMember(ctx, workspace._id);

  const folder = await ctx.db.get(folderId);
  if (folder === null || folder.workspaceId !== workspace._id) {
    throw new ConvexError('Folder not found.');
  }
  return folder;
}

export const get = query({
  args: { workspaceName: v.string(), folderId: v.id('folders') },
  returns: v.union(v.null(), folderValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const folder = await ctx.db.get(args.folderId);
    if (folder === null || folder.workspaceId !== workspace._id) {
      return null;
    }
    const creator = await ctx.db.get(folder.createdBy);
    return {
      ...folder,
      createdByName: creator?.name ?? 'Unknown',
      createdByEmail: creator?.email ?? '',
    };
  },
});

const folderPathSegmentValidator = v.object({
  _id: v.id('folders'),
  name: v.string(),
});

export type FolderPathSegment = Infer<typeof folderPathSegmentValidator>;

/** The directory path of a folder, ordered from the root folder down to the
 * folder itself. Null when the folder does not exist or the signed-in user
 * is not a member of the workspace. */
export const path = query({
  args: { workspaceName: v.string(), folderId: v.id('folders') },
  returns: v.union(v.null(), v.array(folderPathSegmentValidator)),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const folder = await ctx.db.get(args.folderId);
    if (folder === null || folder.workspaceId !== workspace._id) {
      return null;
    }

    const segments: FolderPathSegment[] = [];
    let current: Doc<'folders'> | null = folder;
    // Parent chains cannot cycle, but cap the walk defensively so a corrupt
    // chain can never loop forever.
    for (let depth = 0; current !== null && depth < 100; depth++) {
      segments.push({ _id: current._id, name: current.name });
      current = current.parentId ? await ctx.db.get(current.parentId) : null;
    }
    return segments.reverse();
  },
});

/** Folders inside a folder, or the workspace's root folders when `parentId`
 * is omitted. */
export const list = query({
  args: {
    workspaceName: v.string(),
    parentId: v.optional(v.id('folders')),
  },
  returns: v.array(folderValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('folders')
      .withIndex('parent', (q) =>
        q.eq('workspaceId', workspace._id).eq('parentId', args.parentId)
      )
      .collect();
    const creatorCache = new Map<
      Id<'users'>,
      { name: string; email: string }
    >();
    const result: Folder[] = [];
    for (const row of rows) {
      let creator = creatorCache.get(row.createdBy);
      if (creator === undefined) {
        const user = await ctx.db.get(row.createdBy);
        creator = { name: user?.name ?? 'Unknown', email: user?.email ?? '' };
        creatorCache.set(row.createdBy, creator);
      }
      result.push({
        ...row,
        createdByName: creator.name,
        createdByEmail: creator.email,
      });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
    parentId: v.optional(v.id('folders')),
  },
  returns: v.id('folders'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    if (args.parentId !== undefined) {
      const parent = await ctx.db.get(args.parentId);
      if (parent === null || parent.workspaceId !== workspace._id) {
        throw new ConvexError('Parent folder not found.');
      }
    }

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Folder name is required.');
    }
    const existing = await ctx.db
      .query('folders')
      .withIndex('parentName', (q) =>
        q
          .eq('workspaceId', workspace._id)
          .eq('parentId', args.parentId)
          .eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError('A folder with this name already exists here.');
    }

    return await ctx.db.insert('folders', {
      workspaceId: workspace._id,
      name,
      parentId: args.parentId,
      createdBy: membership.userId,
    });
  },
});

export const rename = mutation({
  args: {
    workspaceName: v.string(),
    folderId: v.id('folders'),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const folder = await getMemberFolder(
      ctx,
      args.workspaceName,
      args.folderId
    );

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Folder name is required.');
    }
    if (name === folder.name) {
      return null;
    }
    const existing = await ctx.db
      .query('folders')
      .withIndex('parentName', (q) =>
        q
          .eq('workspaceId', folder.workspaceId)
          .eq('parentId', folder.parentId)
          .eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError('A folder with this name already exists here.');
    }
    await ctx.db.patch(folder._id, { name });
    return null;
  },
});

/** Move a folder under a new parent, or to the workspace root when
 * `parentId` is omitted. */
export const move = mutation({
  args: {
    workspaceName: v.string(),
    folderId: v.id('folders'),
    parentId: v.optional(v.id('folders')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const folder = await getMemberFolder(
      ctx,
      args.workspaceName,
      args.folderId
    );
    if (folder.parentId === args.parentId) {
      return null;
    }

    if (args.parentId !== undefined) {
      if (args.parentId === folder._id) {
        throw new ConvexError('A folder cannot be moved into itself.');
      }
      const parent = await ctx.db.get(args.parentId);
      if (parent === null || parent.workspaceId !== folder.workspaceId) {
        throw new ConvexError('Destination folder not found.');
      }
      // Walk up from the destination; finding the folder on the way to the
      // root means the destination is inside it.
      let current = parent.parentId;
      for (let depth = 0; current !== undefined && depth < 100; depth++) {
        if (current === folder._id) {
          throw new ConvexError(
            'A folder cannot be moved into its own subfolder.'
          );
        }
        const node = await ctx.db.get(current);
        current = node?.parentId;
      }
    }

    const existing = await ctx.db
      .query('folders')
      .withIndex('parentName', (q) =>
        q
          .eq('workspaceId', folder.workspaceId)
          .eq('parentId', args.parentId)
          .eq('name', folder.name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError('A folder with this name already exists here.');
    }

    await ctx.db.patch(folder._id, { parentId: args.parentId });
    return null;
  },
});

export const remove = mutation({
  args: { workspaceName: v.string(), folderId: v.id('folders') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const folder = await getMemberFolder(
      ctx,
      args.workspaceName,
      args.folderId
    );

    // Delete the folder, all of its descendant folders, and the workflows
    // inside them.
    const stack: Id<'folders'>[] = [folder._id];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const children = await ctx.db
        .query('folders')
        .withIndex('parent', (q) =>
          q.eq('workspaceId', folder.workspaceId).eq('parentId', current)
        )
        .collect();
      for (const child of children) {
        stack.push(child._id);
      }
      const workflows = await ctx.db
        .query('workflows')
        .withIndex('folder', (q) =>
          q.eq('workspaceId', folder.workspaceId).eq('folderId', current)
        )
        .collect();
      for (const workflow of workflows) {
        await ctx.db.delete(workflow._id);
      }
      await ctx.db.delete(current);
    }
    return null;
  },
});
