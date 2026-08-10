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

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

export const fileStatusValidator = v.union(
  v.literal('uploading'),
  v.literal('assembling'),
  v.literal('processing'),
  v.literal('indexed'),
  v.literal('failed')
);
export type FileStatus = Infer<typeof fileStatusValidator>;

/** The client-facing shape of a file. `storageId` and `chunks` are internal and
 * intentionally omitted; clients use `url` (null until the blob exists). */
const fileValidator = v.object({
  _id: v.id('files'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  folderId: v.optional(v.id('folders')),
  size: v.number(),
  contentType: v.string(),
  status: fileStatusValidator,
  /** 0–100 for the current phase (upload transfer, then indexing). */
  progress: v.number(),
  uploadedBy: v.id('users'),
  uploadedByName: v.string(),
  uploadedByEmail: v.string(),
  uploadedByImageUrl: v.union(v.null(), v.string()),
  /** A short-lived URL to download the blob, or null before it exists. */
  url: v.union(v.null(), v.string()),
  updatedAt: v.number(),
});

export type File = Infer<typeof fileValidator>;

// Chunked uploads split into blobs of this size; the client uses the same
// threshold to decide whether to chunk.
const PROGRESS_STEP = 20;
const STEP_MS = 400;
// An upload that never finishes (tab closed mid-transfer) is failed after this.
const STALL_TIMEOUT_MS = 10 * 60 * 1000;

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

/** Shared shape returned by `get`/`list`: resolves the uploader + download URL
 * and drops the internal fields. */
async function toClientFile(
  ctx: QueryCtx,
  file: Doc<'files'>,
  uploader: { name: string; email: string; imageUrl: string | null }
): Promise<File> {
  return {
    _id: file._id,
    _creationTime: file._creationTime,
    workspaceId: file.workspaceId,
    name: file.name,
    folderId: file.folderId,
    size: file.size,
    contentType: file.contentType,
    status: file.status,
    progress: file.progress ?? 100,
    uploadedBy: file.uploadedBy,
    uploadedByName: uploader.name,
    uploadedByEmail: uploader.email,
    uploadedByImageUrl: uploader.imageUrl,
    url: file.storageId ? await ctx.storage.getUrl(file.storageId) : null,
    updatedAt: file.updatedAt,
  };
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
    return await toClientFile(ctx, file, {
      name: uploader?.name ?? 'Unknown',
      email: uploader?.email ?? '',
      imageUrl: await resolveUserImageUrl(ctx, uploader),
    });
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
      result.push(await toClientFile(ctx, row, uploader));
    }
    return result;
  },
});

/** A short-lived URL the client POSTs raw bytes to (a whole file, or one chunk
 * of a large file); the response yields the `storageId` of the stored blob. */
export const generateUploadUrl = mutation({
  args: { workspaceName: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    await requireMember(ctx, workspace._id);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Creates the file row up front, in the `uploading` state, so it shows in the
 * list with a live progress bar while its bytes transfer. Returns the id the
 * client reports progress against. */
export const startUpload = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
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
      size: args.size,
      contentType: args.contentType,
      status: 'uploading',
      progress: 0,
      chunks: [],
      uploadedBy: membership.userId,
      updatedAt: Date.now(),
    });
    // Fail the row if the client goes away mid-transfer.
    await ctx.scheduler.runAfter(
      STALL_TIMEOUT_MS,
      internal.files.cleanupStalled,
      {
        fileId,
      }
    );
    return fileId;
  },
});

/** Records transfer progress for an in-flight upload. Ignored once the file has
 * moved past `uploading`, so late updates can't clobber a finished file. */
export const setUploadProgress = mutation({
  args: {
    workspaceName: v.string(),
    fileId: v.id('files'),
    progress: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);
    if (file.status !== 'uploading') {
      return null;
    }
    await ctx.db.patch(file._id, {
      progress: Math.max(0, Math.min(100, Math.round(args.progress))),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Records one uploaded chunk blob against a chunked upload, in order. */
export const addChunk = mutation({
  args: {
    workspaceName: v.string(),
    fileId: v.id('files'),
    storageId: v.id('_storage'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);
    if (file.status !== 'uploading') {
      return null;
    }
    await ctx.db.patch(file._id, {
      chunks: [...(file.chunks ?? []), args.storageId],
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Sets a file's status to `processing`, resets progress, and starts the
 * (simulated) indexing pipeline. */
async function beginIndexing(ctx: MutationCtx, fileId: Id<'files'>) {
  await ctx.db.patch(fileId, {
    status: 'processing',
    progress: 0,
    updatedAt: Date.now(),
  });
  await ctx.scheduler.runAfter(400, internal.files.advanceIndexing, {
    fileId,
    progress: PROGRESS_STEP,
  });
}

/** Completes an upload. With `storageId` (a single-shot upload) the blob is
 * ready, so it goes straight to indexing. Without one (a chunked upload) it
 * moves to `assembling` and schedules server-side reassembly. */
export const finishUpload = mutation({
  args: {
    workspaceName: v.string(),
    fileId: v.id('files'),
    storageId: v.optional(v.id('_storage')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);
    if (file.status !== 'uploading') {
      return null;
    }

    if (args.storageId !== undefined) {
      await ctx.db.patch(file._id, {
        storageId: args.storageId,
        progress: 100,
      });
      await beginIndexing(ctx, file._id);
      return null;
    }

    if ((file.chunks ?? []).length === 0) {
      throw new ConvexError('No chunks were uploaded.');
    }
    await ctx.db.patch(file._id, {
      status: 'assembling',
      progress: 100,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.files.assembleUpload, {
      fileId: file._id,
    });
    return null;
  },
});

/** Abandons an in-flight upload (client error/abort): removes the row and its
 * chunk blobs. */
export const cancelUpload = mutation({
  args: { workspaceName: v.string(), fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await getMemberFile(ctx, args.workspaceName, args.fileId);
    if (file.status !== 'uploading' && file.status !== 'assembling') {
      return null;
    }
    for (const chunkId of file.chunks ?? []) {
      await ctx.storage.delete(chunkId);
    }
    await ctx.db.delete(file._id);
    return null;
  },
});

const assemblyInfoValidator = v.union(
  v.null(),
  v.object({
    chunks: v.array(v.id('_storage')),
    contentType: v.string(),
    status: fileStatusValidator,
  })
);

/** Internal read for the assembly action, which has no database access. */
export const forAssembly = internalQuery({
  args: { fileId: v.id('files') },
  returns: assemblyInfoValidator,
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file === null) {
      return null;
    }
    return {
      chunks: file.chunks ?? [],
      contentType: file.contentType,
      status: file.status,
    };
  },
});

/** Reassembles a chunked upload: reads each chunk blob in order, stitches them
 * into one blob, stores it, deletes the chunk blobs, then indexes the file.
 * Runs as an action so it can read/store blobs. */
export const assembleUpload = internalAction({
  args: { fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const info = await ctx.runQuery(internal.files.forAssembly, {
      fileId: args.fileId,
    });
    if (info === null || info.status !== 'assembling') {
      return null;
    }
    try {
      const parts: Blob[] = [];
      for (const chunkId of info.chunks) {
        const blob = await ctx.storage.get(chunkId);
        if (blob === null) {
          throw new Error('A chunk was missing.');
        }
        parts.push(blob);
      }
      const storageId = await ctx.storage.store(
        new Blob(parts, { type: info.contentType })
      );
      await ctx.runMutation(internal.files.completeAssembly, {
        fileId: args.fileId,
        storageId,
      });
    } catch {
      await ctx.runMutation(internal.files.failUpload, { fileId: args.fileId });
    }
    return null;
  },
});

/** Applies a successful reassembly: stores the final blob id, deletes the now
 * redundant chunk blobs, and starts indexing. */
export const completeAssembly = internalMutation({
  args: { fileId: v.id('files'), storageId: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file === null || file.status !== 'assembling') {
      return null;
    }
    for (const chunkId of file.chunks ?? []) {
      await ctx.storage.delete(chunkId);
    }
    await ctx.db.patch(args.fileId, { storageId: args.storageId, chunks: [] });
    await beginIndexing(ctx, args.fileId);
    return null;
  },
});

/** Marks an upload failed and cleans up its chunk blobs. */
export const failUpload = internalMutation({
  args: { fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (file === null) {
      return null;
    }
    for (const chunkId of file.chunks ?? []) {
      await ctx.storage.delete(chunkId);
    }
    await ctx.db.patch(args.fileId, {
      status: 'failed',
      chunks: [],
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Fails an upload that never completed (e.g. the tab closed mid-transfer). */
export const cleanupStalled = internalMutation({
  args: { fileId: v.id('files') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (
      file === null ||
      (file.status !== 'uploading' && file.status !== 'assembling')
    ) {
      return null;
    }
    for (const chunkId of file.chunks ?? []) {
      await ctx.storage.delete(chunkId);
    }
    await ctx.db.patch(args.fileId, {
      status: 'failed',
      chunks: [],
      updatedAt: Date.now(),
    });
    return null;
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
    // Clean up the blob and any not-yet-assembled chunk blobs.
    if (file.storageId) {
      await ctx.storage.delete(file.storageId);
    }
    for (const chunkId of file.chunks ?? []) {
      await ctx.storage.delete(chunkId);
    }
    await ctx.db.delete(file._id);
    return null;
  },
});

// --- Indexing pipeline (runs after the blob exists) --------------------------
// Progress climbs 20 → 40 → 60 → 80 → 100 (each streamed to the client); once
// it's shown a full 100% it verifies the blob and indexes.

/** One step of the indexing pipeline: records progress and either schedules the
 * next step or the final verification. The reactive queries stream each bump. */
export const advanceIndexing = internalMutation({
  args: { fileId: v.id('files'), progress: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
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
      url: file.storageId ? await ctx.storage.getUrl(file.storageId) : null,
    };
  },
});

/** Final pipeline step: confirms the blob is actually retrievable with a HEAD
 * request against its storage URL, then marks the file indexed (or failed). */
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
