import { ConvexError, Infer, v } from 'convex/values';

import { internal } from './_generated/api';
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { resolveUserImageUrl } from './users';
import {
  getMemberWorkspaceByName,
  getWorkspaceByNameOrThrow,
  requireMember,
} from './workspaces';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

export const fileStatusValidator = v.union(
  v.literal('processing'),
  v.literal('indexed'),
  v.literal('failed')
);
export type FileStatus = Infer<typeof fileStatusValidator>;

const fileValidator = v.object({
  _id: v.id('files'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  folderId: v.optional(v.id('folders')),
  storageId: v.id('_storage'),
  size: v.number(),
  contentType: v.string(),
  status: fileStatusValidator,
  /** Indexing progress 0–100 while `status` is `processing`. */
  progress: v.number(),
  uploadedBy: v.id('users'),
  uploadedByName: v.string(),
  uploadedByEmail: v.string(),
  uploadedByImageUrl: v.union(v.null(), v.string()),
  /** A short-lived URL to download the blob, or null if it has expired. */
  url: v.union(v.null(), v.string()),
  updatedAt: v.number(),
});

export type File = Infer<typeof fileValidator>;

async function getMemberFile(
  ctx: MutationCtx,
  workspaceName: string,
  fileId: Id<'files'>
) {
  const workspace = await getWorkspaceByNameOrThrow(ctx, workspaceName);
  await requireMember(ctx, workspace._id);

  const file = await ctx.db.get(fileId);
  if (file === null || file.workspaceId !== workspace._id) {
    throw new ConvexError('File not found.');
  }
  return file;
}

export const get = query({
  args: { workspaceName: v.string(), fileId: v.id('files') },
  returns: v.union(v.null(), fileValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const file = await ctx.db.get(args.fileId);
    if (file === null || file.workspaceId !== workspace._id) {
      return null;
    }
    const uploader = await ctx.db.get(file.uploadedBy);
    return {
      ...file,
      progress: file.progress ?? 100,
      uploadedByName: uploader?.name ?? 'Unknown',
      uploadedByEmail: uploader?.email ?? '',
      uploadedByImageUrl: await resolveUserImageUrl(ctx, uploader),
      url: await ctx.storage.getUrl(file.storageId),
    };
  },
});

/** Files in a folder, or the workspace's root files when `folderId` is
 * omitted. */
export const list = query({
  args: {
    workspaceName: v.string(),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.array(fileValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('files')
      .withIndex('folder', (q) =>
        q.eq('workspaceId', workspace._id).eq('folderId', args.folderId)
      )
      .collect();
    const uploaderCache = new Map<
      Id<'users'>,
      { name: string; email: string; imageUrl: string | null }
    >();
    const result: File[] = [];
    for (const row of rows) {
      let uploader = uploaderCache.get(row.uploadedBy);
      if (uploader === undefined) {
        const user = await ctx.db.get(row.uploadedBy);
        uploader = {
          name: user?.name ?? 'Unknown',
          email: user?.email ?? '',
          imageUrl: await resolveUserImageUrl(ctx, user),
        };
        uploaderCache.set(row.uploadedBy, uploader);
      }
      result.push({
        ...row,
        progress: row.progress ?? 100,
        uploadedByName: uploader.name,
        uploadedByEmail: uploader.email,
        uploadedByImageUrl: uploader.imageUrl,
        url: await ctx.storage.getUrl(row.storageId),
      });
    }
    return result;
  },
});

/** A short-lived URL the client POSTs the raw file bytes to; the response
 * yields the `storageId` to pass to `create`. */
export const generateUploadUrl = mutation({
  args: { workspaceName: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    await requireMember(ctx, workspace._id);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Records an uploaded blob as a file and kicks off the (simulated) indexing
 * pipeline. */
export const create = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
    storageId: v.id('_storage'),
    size: v.number(),
    contentType: v.string(),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.id('files'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (
        folder === null ||
        folder.workspaceId !== workspace._id ||
        folder.kind !== 'file'
      ) {
        throw new ConvexError('Folder not found.');
      }
    }

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('File name is required.');
    }

    const fileId = await ctx.db.insert('files', {
      workspaceId: workspace._id,
      name,
      folderId: args.folderId,
      storageId: args.storageId,
      size: args.size,
      contentType: args.contentType,
      status: 'processing',
      progress: 0,
      uploadedBy: membership.userId,
      updatedAt: Date.now(),
    });
    // Kick off the (simulated) indexing pipeline. Each step bumps `progress`,
    // which the reactive queries stream to clients until it verifies + indexes.
    await ctx.scheduler.runAfter(400, internal.files.advanceIndexing, {
      fileId,
      progress: PROGRESS_STEP,
    });
    return fileId;
  },
});

export const rename = mutation({
  args: {
    workspaceName: v.string(),
    fileId: v.id('files'),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('File name is required.');
    }
    if (name === file.name) {
      return null;
    }
    await ctx.db.patch(file._id, { name, updatedAt: Date.now() });
    return null;
  },
});

/** Move a file into a folder, or to the workspace root when `folderId` is
 * omitted. */
export const move = mutation({
  args: {
    workspaceName: v.string(),
    fileId: v.id('files'),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (
        folder === null ||
        folder.workspaceId !== file.workspaceId ||
        folder.kind !== 'file'
      ) {
        throw new ConvexError('Destination folder not found.');
      }
    }
    if (file.folderId === args.folderId) {
      return null;
    }
    await ctx.db.patch(file._id, {
      folderId: args.folderId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { workspaceName: v.string(), fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);
    await ctx.storage.delete(file.storageId);
    await ctx.db.delete(file._id);
    return null;
  },
});

// How much the simulated indexing pipeline advances per step, and how long
// each step takes. Progress climbs 20 → 40 → 60 → 80 → 100 (each streamed to
// the client); once it's shown a full 100% it verifies the blob and indexes.
const PROGRESS_STEP = 20;
const STEP_MS = 400;

/** One step of the indexing pipeline: records progress and either schedules the
 * next step or the final verification. The reactive queries stream each bump. */
export const advanceIndexing = internalMutation({
  args: { fileId: v.id('files'), progress: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    // Bail if the file was deleted or already left the processing state.
    if (file === null || file.status !== 'processing') {
      return null;
    }
    await ctx.db.patch(args.fileId, {
      progress: args.progress,
      updatedAt: Date.now(),
    });
    if (args.progress < 100) {
      await ctx.scheduler.runAfter(STEP_MS, internal.files.advanceIndexing, {
        fileId: args.fileId,
        progress: args.progress + PROGRESS_STEP,
      });
    } else {
      // Hold at a visible 100% for a beat, then verify the blob and index.
      await ctx.scheduler.runAfter(STEP_MS, internal.files.finalizeUpload, {
        fileId: args.fileId,
      });
    }
    return null;
  },
});

/** Internal read for the verification action, which has no database access. */
export const forFinalize = internalQuery({
  args: { fileId: v.id('files') },
  returns: v.union(
    v.null(),
    v.object({
      status: fileStatusValidator,
      url: v.union(v.null(), v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file === null) {
      return null;
    }
    return {
      status: file.status,
      url: await ctx.storage.getUrl(file.storageId),
    };
  },
});

/** Final pipeline step: confirms the uploaded blob is actually retrievable with
 * a HEAD request against its storage URL, then marks the file indexed (or
 * failed). Runs as an action so it can make the outbound request. */
export const finalizeUpload = internalAction({
  args: { fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.runQuery(internal.files.forFinalize, {
      fileId: args.fileId,
    });
    if (file === null || file.status !== 'processing') {
      return null;
    }
    let ok = false;
    if (file.url !== null) {
      try {
        const response = await fetch(file.url, { method: 'HEAD' });
        ok = response.ok;
      } catch {
        ok = false;
      }
    }
    await ctx.runMutation(internal.files.completeUpload, {
      fileId: args.fileId,
      ok,
    });
    return null;
  },
});

/** Applies the verification result: indexed on success, failed otherwise. */
export const completeUpload = internalMutation({
  args: { fileId: v.id('files'), ok: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file === null || file.status !== 'processing') {
      return null;
    }
    await ctx.db.patch(args.fileId, {
      status: args.ok ? 'indexed' : 'failed',
      progress: 100,
      updatedAt: Date.now(),
    });
    return null;
  },
});
