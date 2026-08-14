import { ConvexError, Infer, v } from 'convex/values';

import { WORKFLOW_TEMPLATES } from '../lib/workflow-templates';
import { internal } from './_generated/api';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { workflowCanvasValidator } from './canvas';
import { resolveUserImageUrl } from './users';
import {
  getMemberWorkspaceByName,
  getWorkspaceByNameOrThrow,
  requireMember,
  requireUserId,
} from './workspaces';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import type { WorkflowCanvasData } from './canvas';

const workflowValidator = v.object({
  _id: v.id('workflows'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  description: v.optional(v.string()),
  isPublished: v.boolean(),
  folderId: v.optional(v.id('folders')),
  ownerId: v.id('users'),
  ownerName: v.string(),
  ownerEmail: v.string(),
  ownerImageUrl: v.union(v.null(), v.string()),
  isOwner: v.boolean(),
  canvas: workflowCanvasValidator,
  chainWorkflowIds: v.optional(v.array(v.id('workflows'))),
  runCount: v.number(),
  successCount: v.number(),
  failCount: v.number(),
  lastRunAt: v.optional(v.number()),
  lastRunStatus: v.optional(
    v.union(v.literal('success'), v.literal('error'), v.literal('stopped'))
  ),
  updatedAt: v.number(),
});

export type Workflow = Infer<typeof workflowValidator>;

async function getMemberWorkflow(
  ctx: MutationCtx,
  workspaceName: string,
  workflowId: Id<'workflows'>
) {
  const workspace = await getWorkspaceByNameOrThrow(ctx, workspaceName);
  await requireMember(ctx, workspace._id);

  const workflow = await ctx.db.get(workflowId);
  if (workflow === null || workflow.workspaceId !== workspace._id) {
    throw new ConvexError('Workflow not found.');
  }
  return workflow;
}

/** A workflow name in the workspace that isn't taken: `base`, then "base 2",
 * "base 3", … . Used when the name is generated rather than user-supplied. */
async function nextAvailableWorkflowName(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  base: string
) {
  let name = base;
  let suffix = 2;
  while (
    (await ctx.db
      .query('workflows')
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
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.union(v.null(), workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const userId = await requireUserId(ctx);
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return null;
    }
    const owner = await ctx.db.get(workflow.ownerId);
    // `webhookToken` is a secret; keep it out of the client shape (exposed only
    // via the member-gated `webhookUrl` query).
    const { webhookToken: _webhookToken, ...rest } = workflow;
    return {
      ...rest,
      ownerName: owner?.name ?? 'Unknown',
      ownerEmail: owner?.email ?? '',
      ownerImageUrl: await resolveUserImageUrl(ctx, owner),
      isOwner: workflow.ownerId === userId,
    };
  },
});

/** Workflows in a folder, or the workspace's root workflows when `folderId`
 * is omitted. */
export const list = query({
  args: {
    workspaceName: v.string(),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.array(workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('workflows')
      .withIndex('folder', (q) =>
        q.eq('workspaceId', workspace._id).eq('folderId', args.folderId)
      )
      .collect();
    const ownerCache = new Map<
      Id<'users'>,
      { name: string; email: string; imageUrl: string | null }
    >();
    const result: Workflow[] = [];
    for (const row of rows) {
      // Unpublished workflows are visible only to their owner.
      if (!row.isPublished && row.ownerId !== userId) {
        continue;
      }
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
      const { webhookToken: _webhookToken, ...rest } = row;
      result.push({
        ...rest,
        ownerName: owner.name,
        ownerEmail: owner.email,
        ownerImageUrl: owner.imageUrl,
        isOwner: row.ownerId === userId,
      });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== workspace._id) {
        throw new ConvexError('Folder not found.');
      }
    }

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Workflow name is required.');
    }
    // .first() rather than .unique(): duplicates that predate this
    // constraint may still exist in the table.
    const existing = await ctx.db
      .query('workflows')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspace._id).eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError(
        'A workflow with this name already exists in this workspace.'
      );
    }
    const description = args.description?.trim();

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: description ? description : undefined,
      isPublished: false,
      folderId: args.folderId,
      ownerId: membership.userId,
      canvas: {
        nodes: {},
        edges: [],
        version: 1,
      },
      runCount: 0,
      successCount: 0,
      failCount: 0,
      updatedAt: Date.now(),
    });
  },
});

export const rename = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Workflow name is required.');
    }
    if (name === workflow.name) {
      return null;
    }
    const existing = await ctx.db
      .query('workflows')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workflow.workspaceId).eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError(
        'A workflow with this name already exists in this workspace.'
      );
    }
    await ctx.db.patch(workflow._id, { name, updatedAt: Date.now() });
    return null;
  },
});

/** Publish or unpublish a workflow. */
export const setPublished = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    const userId = await requireUserId(ctx);
    if (workflow.ownerId !== userId) {
      throw new ConvexError(
        'Only the workflow owner can change its published status.'
      );
    }

    if (workflow.isPublished === args.isPublished) {
      return null;
    }
    await ctx.db.patch(workflow._id, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Copies a workflow (and its canvas) into a new unpublished workflow owned by
 * the current member, with a non-colliding "<name> copy" name. Returns the new
 * workflow id. */
export const duplicate = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    const source = await ctx.db.get(args.workflowId);
    if (source === null || source.workspaceId !== workspace._id) {
      throw new ConvexError('Workflow not found.');
    }

    const name = await nextAvailableWorkflowName(
      ctx,
      workspace._id,
      `${source.name} copy`
    );

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: source.description,
      isPublished: false,
      folderId: source.folderId,
      ownerId: membership.userId,
      canvas: source.canvas,
      runCount: 0,
      successCount: 0,
      failCount: 0,
      updatedAt: Date.now(),
    });
  },
});

/** Creates a new unpublished workflow from a built-in template. Returns the
 * new workflow id. */
export const createFromTemplate = mutation({
  args: {
    workspaceName: v.string(),
    templateId: v.string(),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== workspace._id) {
        throw new ConvexError('Folder not found.');
      }
    }

    const template = WORKFLOW_TEMPLATES.find(
      (candidate) => candidate.id === args.templateId
    );
    if (template === undefined) {
      throw new ConvexError('Template not found.');
    }

    const name = await nextAvailableWorkflowName(
      ctx,
      workspace._id,
      template.name
    );

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: template.description,
      isPublished: false,
      folderId: args.folderId,
      ownerId: membership.userId,
      canvas: template.canvas,
      runCount: 0,
      successCount: 0,
      failCount: 0,
      updatedAt: Date.now(),
    });
  },
});

/** Move a workflow into a folder, or to the workspace root when `folderId`
 * is omitted. */
export const move = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== workflow.workspaceId) {
        throw new ConvexError('Destination folder not found.');
      }
    }
    if (workflow.folderId === args.folderId) {
      return null;
    }
    await ctx.db.patch(workflow._id, {
      folderId: args.folderId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Replace a workflow's canvas, e.g. after nodes move or connect. */
/** How many versions to keep per workflow. */
const MAX_VERSIONS = 30;

type VersionKind = 'auto' | 'manual' | 'restored';

/** Append a canvas snapshot, pruning the oldest beyond MAX_VERSIONS. */
async function insertWorkflowVersion(
  ctx: MutationCtx,
  workflowId: Id<'workflows'>,
  canvas: WorkflowCanvasData,
  userId: Id<'users'>,
  kind: VersionKind,
  name?: string
) {
  await ctx.db.insert('workflowVersions', {
    workflowId,
    canvas,
    createdBy: userId,
    kind,
    name,
  });
  const versions = await ctx.db
    .query('workflowVersions')
    .withIndex('workflow', (q) => q.eq('workflowId', workflowId))
    .order('desc')
    .collect();
  for (const old of versions.slice(MAX_VERSIONS)) {
    await ctx.db.delete(old._id);
  }
}

export const updateCanvas = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    canvas: workflowCanvasValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    await ctx.db.patch(workflow._id, {
      canvas: args.canvas,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Save a version snapshot. With a `name` it's a manual, user-named version;
 * without one it's a timed auto-save that's skipped when nothing has changed
 * since the latest version. */
export const saveVersion = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    const userId = await requireUserId(ctx);

    const name = args.name?.trim();
    if (name) {
      await insertWorkflowVersion(
        ctx,
        workflow._id,
        workflow.canvas,
        userId,
        'manual',
        name
      );
      return null;
    }

    // Auto-save: skip when the canvas is unchanged from the latest version.
    const latest = await ctx.db
      .query('workflowVersions')
      .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
      .order('desc')
      .first();
    if (
      latest !== null &&
      JSON.stringify(latest.canvas) === JSON.stringify(workflow.canvas)
    ) {
      return null;
    }
    await insertWorkflowVersion(
      ctx,
      workflow._id,
      workflow.canvas,
      userId,
      'auto'
    );
    return null;
  },
});

const workflowVersionValidator = v.object({
  _id: v.id('workflowVersions'),
  _creationTime: v.number(),
  kind: v.union(v.literal('auto'), v.literal('manual'), v.literal('restored')),
  name: v.union(v.null(), v.string()),
  createdByName: v.string(),
  createdByImageUrl: v.union(v.null(), v.string()),
});

/** The saved versions of a workflow's canvas, newest first. */
export const listWorkflowVersions = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.array(workflowVersionValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return [];
    }
    const rows = await ctx.db
      .query('workflowVersions')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .order('desc')
      .take(MAX_VERSIONS);
    const cache = new Map<
      Id<'users'>,
      { name: string; imageUrl: string | null }
    >();
    const result: Infer<typeof workflowVersionValidator>[] = [];
    for (const row of rows) {
      let creator = cache.get(row.createdBy);
      if (creator === undefined) {
        const user = await ctx.db.get(row.createdBy);
        creator = {
          name: user?.name ?? 'Unknown',
          imageUrl: await resolveUserImageUrl(ctx, user),
        };
        cache.set(row.createdBy, creator);
      }
      result.push({
        _id: row._id,
        _creationTime: row._creationTime,
        kind: row.kind ?? 'auto',
        name: row.name ?? null,
        createdByName: creator.name,
        createdByImageUrl: creator.imageUrl,
      });
    }
    return result;
  },
});

/** Restore a saved version. Snapshots the current canvas first (so the restore
 * is recoverable), applies the version, and records a "restored" marker.
 * Returns the restored canvas. */
export const restoreVersion = mutation({
  args: {
    workspaceName: v.string(),
    versionId: v.id('workflowVersions'),
  },
  returns: workflowCanvasValidator,
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    const version = await ctx.db.get(args.versionId);
    if (version === null) {
      throw new ConvexError('Version not found.');
    }
    const workflow = await ctx.db.get(version.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      throw new ConvexError('Version not found.');
    }

    // Preserve the current state (unless it's already the latest version).
    const latest = await ctx.db
      .query('workflowVersions')
      .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
      .order('desc')
      .first();
    if (
      latest === null ||
      JSON.stringify(latest.canvas) !== JSON.stringify(workflow.canvas)
    ) {
      await insertWorkflowVersion(
        ctx,
        workflow._id,
        workflow.canvas,
        membership.userId,
        'auto'
      );
    }

    await ctx.db.patch(workflow._id, {
      canvas: version.canvas,
      updatedAt: Date.now(),
    });
    await insertWorkflowVersion(
      ctx,
      workflow._id,
      version.canvas,
      membership.userId,
      'restored'
    );
    return version.canvas;
  },
});

/** The public HTTP URL an inbound webhook posts to, built from the token. */
function webhookUrlFor(token: string) {
  const base = process.env.CONVEX_SITE_URL ?? '';
  return `${base}/webhooks/${token}`;
}

/** The workflow's inbound webhook URL, or null until a member enables it. */
export const webhookUrl = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (
      workflow === null ||
      workflow.workspaceId !== workspace._id ||
      !workflow.webhookToken
    ) {
      return null;
    }
    return webhookUrlFor(workflow.webhookToken);
  },
});

/** Enables the workflow's webhook, minting a token on first use. Idempotent —
 * returns the (existing or new) URL. */
export const ensureWebhook = mutation({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.string(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    let token = workflow.webhookToken;
    if (!token) {
      token = crypto.randomUUID();
      await ctx.db.patch(workflow._id, { webhookToken: token });
    }
    return webhookUrlFor(token);
  },
});

/** Rotates the webhook token, invalidating the old URL. */
export const regenerateWebhook = mutation({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.string(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    const token = crypto.randomUUID();
    await ctx.db.patch(workflow._id, { webhookToken: token });
    return webhookUrlFor(token);
  },
});

/** The other workflows in this workspace, for the chain picker — everything
 * except the current workflow. Just id + name. */
export const otherWorkflows = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.array(v.object({ _id: v.id('workflows'), name: v.string() })),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('workflows')
      .withIndex('workspaceName', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    return rows
      .filter((row) => row._id !== args.workflowId)
      .map((row) => ({ _id: row._id, name: row.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Sets the ordered list of workflows this one's chain runs. Every id must be a
 * workflow in the same workspace (and not this workflow itself). */
export const setChain = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    chainWorkflowIds: v.array(v.id('workflows')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    for (const id of args.chainWorkflowIds) {
      if (id === args.workflowId) {
        throw new ConvexError('A workflow cannot be in its own chain.');
      }
      const step = await ctx.db.get(id);
      if (step === null || step.workspaceId !== workflow.workspaceId) {
        throw new ConvexError('Chain workflow not found in this workspace.');
      }
    }
    await ctx.db.patch(workflow._id, {
      chainWorkflowIds: args.chainWorkflowIds,
    });
    return null;
  },
});

/** Internal: resolves a chain step to the canvas the runner should execute.
 * Scoped to the source workflow's workspace so a chain only runs workflows the
 * author already has access to. */
export const chainStepCanvas = internalQuery({
  args: {
    sourceWorkflowId: v.id('workflows'),
    stepWorkflowId: v.id('workflows'),
  },
  returns: v.union(
    v.null(),
    v.object({ name: v.string(), canvas: workflowCanvasValidator })
  ),
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceWorkflowId);
    const step = await ctx.db.get(args.stepWorkflowId);
    if (source === null || step === null) {
      return null;
    }
    if (source.workspaceId !== step.workspaceId) {
      return null;
    }
    return { name: step.name, canvas: step.canvas };
  },
});

/** Internal: resolves a webhook token to the workflow the endpoint should run.
 * Not member-gated — the token is the credential. */
export const byWebhookToken = internalQuery({
  args: { token: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      workflowId: v.id('workflows'),
      canvas: workflowCanvasValidator,
    })
  ),
  handler: async (ctx, args) => {
    const workflow = await ctx.db
      .query('workflows')
      .withIndex('webhookToken', (q) => q.eq('webhookToken', args.token))
      .unique();
    if (workflow === null) {
      return null;
    }
    return { workflowId: workflow._id, canvas: workflow.canvas };
  },
});

export const remove = mutation({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );

    // Drop the live run doc so no stale run state lingers.
    const run = await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
      .unique();
    if (run !== null) {
      await ctx.db.delete(run._id);
    }

    // Drop any schedule that fires this workflow so the dispatcher stops trying.
    const schedule = await ctx.db
      .query('workflowSchedules')
      .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
      .unique();
    if (schedule !== null) {
      await ctx.db.delete(schedule._id);
    }

    // Remove this workflow from any sibling's chain so no chain references a
    // deleted workflow.
    const siblings = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) =>
        q.eq('workspaceId', workflow.workspaceId)
      )
      .collect();
    for (const sibling of siblings) {
      if (
        sibling._id !== workflow._id &&
        sibling.chainWorkflowIds?.includes(workflow._id)
      ) {
        await ctx.db.patch(sibling._id, {
          chainWorkflowIds: sibling.chainWorkflowIds.filter(
            (id) => id !== workflow._id
          ),
        });
      }
    }

    await ctx.db.delete(workflow._id);

    // Run history and versions can be numerous, so purge them in the background
    // in batches rather than risk exceeding a single mutation's limits.
    await ctx.scheduler.runAfter(0, internal.workflows.purgeWorkflowData, {
      workflowId: workflow._id,
    });
    return null;
  },
});

/** Deletes a deleted workflow's run-history and version rows in batches,
 * rescheduling itself until both tables are drained. */
export const purgeWorkflowData = internalMutation({
  args: { workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const BATCH = 100;

    const history = await ctx.db
      .query('runHistory')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .take(BATCH);
    for (const row of history) {
      await ctx.db.delete(row._id);
    }

    const versions = await ctx.db
      .query('workflowVersions')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .take(BATCH);
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    // A full batch means there may be more — keep going next tick.
    if (history.length === BATCH || versions.length === BATCH) {
      await ctx.scheduler.runAfter(0, internal.workflows.purgeWorkflowData, {
        workflowId: args.workflowId,
      });
    }
    return null;
  },
});

/** Records a finished backend run: bumps the counters and stamps when/how the
 * workflow last ran. A stopped run counts as a run but not a failure. Does not
 * touch `updatedAt` — that tracks edits, not runs. */
export const recordRun = internalMutation({
  args: {
    workflowId: v.id('workflows'),
    status: v.union(
      v.literal('success'),
      v.literal('error'),
      v.literal('stopped')
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null) {
      return null;
    }
    await ctx.db.patch(args.workflowId, {
      runCount: workflow.runCount + 1,
      successCount: workflow.successCount + (args.status === 'success' ? 1 : 0),
      failCount: workflow.failCount + (args.status === 'error' ? 1 : 0),
      lastRunAt: Date.now(),
      lastRunStatus: args.status,
    });
    return null;
  },
});
