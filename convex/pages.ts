import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { pageLayoutValidator } from './pageLayout';
import { resolveUserImageUrl } from './users';
import {
  getMembership,
  getMemberWorkspaceById,
  getWorkspaceByIdOrThrow,
  requireUserId,
  requireWriteAccess,
} from './workspaces';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

const pageValidator = v.object({
  _id: v.id('pages'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  ownerId: v.id('users'),
  ownerName: v.string(),
  ownerEmail: v.string(),
  ownerImageUrl: v.union(v.null(), v.string()),
  isOwner: v.boolean(),
  isPublished: v.boolean(),
  workflowId: v.optional(v.id('workflows')),
  /** Name of the bound workflow, resolved for display; absent when unbound or
   * the workflow was deleted. */
  workflowName: v.optional(v.string()),
  folderId: v.optional(v.id('folders')),
  layout: pageLayoutValidator,
  updatedAt: v.number(),
});

export type Page = Infer<typeof pageValidator>;

/** A blank page layout, seeded on create. */
const EMPTY_LAYOUT = { components: [], version: 1 };

async function getMemberPage(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  pageId: Id<'pages'>
) {
  const workspace = await getWorkspaceByIdOrThrow(ctx, workspaceId);
  await requireWriteAccess(ctx, workspace._id);

  const page = await ctx.db.get(pageId);
  if (page === null || page.workspaceId !== workspace._id) {
    throw new ConvexError('Page not found.');
  }
  return page;
}

/** A page name in the workspace that isn't taken: `base`, then "base 2",
 * "base 3", … . Used when the name is generated rather than user-supplied. */
async function nextAvailablePageName(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  base: string
) {
  let name = base;
  let suffix = 2;
  while (
    (await ctx.db
      .query('pages')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspaceId).eq('name', name)
      )
      .first()) !== null
  ) {
    name = `${base} ${suffix}`;
    suffix += 1;
  }
  return name;
}

export const get = query({
  args: { workspaceId: v.id('workspaces'), pageId: v.id('pages') },
  returns: v.union(v.null(), pageValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
    if (workspace === null) {
      return null;
    }
    const userId = await requireUserId(ctx);
    const page = await ctx.db.get(args.pageId);
    if (page === null || page.workspaceId !== workspace._id) {
      return null;
    }
    const owner = await ctx.db.get(page.ownerId);
    const workflow = page.workflowId ? await ctx.db.get(page.workflowId) : null;
    return {
      ...page,
      isPublished: page.isPublished ?? false,
      workflowName: workflow?.name,
      ownerName: owner?.name ?? 'Unknown',
      ownerEmail: owner?.email ?? '',
      ownerImageUrl: await resolveUserImageUrl(ctx, owner),
      isOwner: page.ownerId === userId,
    };
  },
});

/** Publish or unpublish the page. Same member-gated logic as workflows. */
export const setPublished = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    pageId: v.id('pages'),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getMemberPage(ctx, args.workspaceId, args.pageId);
    await ctx.db.patch(page._id, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
    return null;
  },
});

const publishedPageValidator = v.object({
  _id: v.id('pages'),
  name: v.string(),
  workspaceId: v.id('workspaces'),
  workflowId: v.optional(v.id('workflows')),
  layout: pageLayoutValidator,
});

/** The standalone published view of a page. Returns the page only when the
 * caller is signed in AND a member of the owning workspace AND the page is
 * published; null in every other case (so the route can 404). */
export const getPublished = query({
  args: { pageId: v.id('pages') },
  returns: v.union(v.null(), publishedPageValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const page = await ctx.db.get(args.pageId);
    if (page === null || !(page.isPublished ?? false)) {
      return null;
    }
    const membership = await getMembership(ctx, page.workspaceId, userId);
    if (membership === null) {
      return null;
    }
    const workspace = await ctx.db.get(page.workspaceId);
    if (workspace === null) {
      return null;
    }
    return {
      _id: page._id,
      name: page.name,
      workspaceId: workspace._id,
      workflowId: page.workflowId,
      layout: page.layout,
    };
  },
});

export const list = query({
  args: {
    workspaceId: v.id('workspaces'),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.array(pageValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
    if (workspace === null) {
      return [];
    }
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('pages')
      .withIndex('folder', (q) =>
        q.eq('workspaceId', workspace._id).eq('folderId', args.folderId)
      )
      .collect();
    const ownerCache = new Map<
      Id<'users'>,
      { name: string; email: string; imageUrl: string | null }
    >();
    const workflowNameCache = new Map<Id<'workflows'>, string | undefined>();
    const result: Page[] = [];
    for (const row of rows) {
      let owner = ownerCache.get(row.ownerId);
      if (owner === undefined) {
        const user = await ctx.db.get(row.ownerId);
        owner = {
          name: user?.name ?? 'Unknown',
          email: user?.email ?? '',
          imageUrl: await resolveUserImageUrl(ctx, user),
        };
        ownerCache.set(row.ownerId, owner);
      }
      let workflowName: string | undefined;
      if (row.workflowId) {
        if (workflowNameCache.has(row.workflowId)) {
          workflowName = workflowNameCache.get(row.workflowId);
        } else {
          const workflow = await ctx.db.get(row.workflowId);
          workflowName = workflow?.name;
          workflowNameCache.set(row.workflowId, workflowName);
        }
      }
      result.push({
        ...row,
        isPublished: row.isPublished ?? false,
        workflowName,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerImageUrl: owner.imageUrl,
        isOwner: row.ownerId === userId,
      });
    }
    return result;
  },
});

/** Minimal id+name of every workflow in the workspace, for the page's workflow
 * picker (the regular workflows list is folder-scoped). */
export const workflowOptions = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(v.object({ _id: v.id('workflows'), name: v.string() })),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
    if (workspace === null) {
      return [];
    }
    await requireUserId(ctx);
    const rows = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    return rows
      .map((row) => ({ _id: row._id, name: row.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Minimal id+name of every ready (indexed) file in the workspace, for a page's
 * file-input picker. */
export const fileOptions = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(v.object({ _id: v.id('files'), name: v.string() })),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
    if (workspace === null) {
      return [];
    }
    await requireUserId(ctx);
    const rows = await ctx.db
      .query('files')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    return rows
      .filter((row) => row.status === 'indexed')
      .map((row) => ({ _id: row._id, name: row.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    name: v.string(),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.id('pages'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByIdOrThrow(ctx, args.workspaceId);
    const membership = await requireWriteAccess(ctx, workspace._id);

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== workspace._id) {
        throw new ConvexError('Folder not found.');
      }
    }

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Page name is required.');
    }
    const existing = await ctx.db
      .query('pages')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspace._id).eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError(
        'A page with this name already exists in this workspace.'
      );
    }

    return await ctx.db.insert('pages', {
      workspaceId: workspace._id,
      name,
      ownerId: membership.userId,
      folderId: args.folderId,
      isPublished: false,
      layout: EMPTY_LAYOUT,
      updatedAt: Date.now(),
    });
  },
});

export const rename = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    pageId: v.id('pages'),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getMemberPage(ctx, args.workspaceId, args.pageId);
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Page name is required.');
    }
    if (name === page.name) {
      return null;
    }
    const existing = await ctx.db
      .query('pages')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', page.workspaceId).eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError(
        'A page with this name already exists in this workspace.'
      );
    }
    await ctx.db.patch(page._id, { name, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { workspaceId: v.id('workspaces'), pageId: v.id('pages') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getMemberPage(ctx, args.workspaceId, args.pageId);
    await ctx.db.delete(page._id);
    return null;
  },
});

/** Move a page into a folder (or to the workspace root with folderId omitted).
 * Verifies the destination folder belongs to the workspace. */
export const move = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    pageId: v.id('pages'),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getMemberPage(ctx, args.workspaceId, args.pageId);
    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== page.workspaceId) {
        throw new ConvexError('Destination folder not found.');
      }
    }
    if (page.folderId === args.folderId) {
      return null;
    }
    await ctx.db.patch(page._id, {
      folderId: args.folderId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const duplicate = mutation({
  args: { workspaceId: v.id('workspaces'), pageId: v.id('pages') },
  returns: v.id('pages'),
  handler: async (ctx, args) => {
    const source = await getMemberPage(ctx, args.workspaceId, args.pageId);
    const membership = await requireWriteAccess(ctx, source.workspaceId);
    const name = await nextAvailablePageName(
      ctx,
      source.workspaceId,
      `${source.name} copy`
    );
    return await ctx.db.insert('pages', {
      workspaceId: source.workspaceId,
      name,
      ownerId: membership.userId,
      workflowId: source.workflowId,
      folderId: source.folderId,
      layout: source.layout,
      updatedAt: Date.now(),
    });
  },
});

/** Persist the page's component layout. Called on every structural edit. */
export const updateLayout = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    pageId: v.id('pages'),
    layout: pageLayoutValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getMemberPage(ctx, args.workspaceId, args.pageId);
    await ctx.db.patch(page._id, {
      layout: args.layout,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Bind (or unbind, with null) the workflow this page drives. Verifies the
 * workflow belongs to the same workspace. */
export const setWorkflow = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    pageId: v.id('pages'),
    workflowId: v.union(v.id('workflows'), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getMemberPage(ctx, args.workspaceId, args.pageId);
    if (args.workflowId !== null) {
      const workflow = await ctx.db.get(args.workflowId);
      if (workflow === null || workflow.workspaceId !== page.workspaceId) {
        throw new ConvexError('Workflow not found.');
      }
    }
    await ctx.db.patch(page._id, {
      workflowId: args.workflowId ?? undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});
