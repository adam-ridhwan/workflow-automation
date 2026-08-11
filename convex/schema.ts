import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { workflowCanvasValidator } from './canvas';

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    /** An uploaded profile picture in Convex storage; takes precedence over
     * `image` (which may hold a provider avatar URL). */
    imageStorageId: v.optional(v.id('_storage')),
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('phone', ['phone']),

  workspaces: defineTable({
    name: v.string(),
    adminId: v.id('users'),
    imageId: v.optional(v.id('_storage')),
  })
    .index('adminId', ['adminId'])
    .index('name', ['name']),

  workspaceMembers: defineTable({
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('collaborator')),
  })
    .index('workspaceId', ['workspaceId'])
    .index('userId', ['userId'])
    .index('workspaceUser', ['workspaceId', 'userId']),

  /** Folders organize either workflows or files; `kind` keeps the two into
   * separate trees so a workflow folder and a file folder never mix. */
  folders: defineTable({
    workspaceId: v.id('workspaces'),
    name: v.string(),
    kind: v.union(v.literal('workflow'), v.literal('file')),
    parentId: v.optional(v.id('folders')),
    createdBy: v.id('users'),
  })
    .index('workspaceId', ['workspaceId'])
    .index('parent', ['workspaceId', 'kind', 'parentId'])
    .index('parentName', ['workspaceId', 'kind', 'parentId', 'name']),

  /** Point-in-time snapshots of a workflow's canvas so a past version can be
   * restored. Captured on a timed auto-save, on a manual named save, or when a
   * version is restored. */
  workflowVersions: defineTable({
    workflowId: v.id('workflows'),
    canvas: workflowCanvasValidator,
    createdBy: v.id('users'),
    kind: v.optional(
      v.union(v.literal('auto'), v.literal('manual'), v.literal('restored'))
    ),
    /** Set only for manual saves. */
    name: v.optional(v.string()),
  }).index('workflow', ['workflowId']),

  /** Latest run per workflow: per-node statuses and outputs, updated live
   * by the runWorkflow action and streamed to clients via subscriptions. */
  runs: defineTable({
    workflowId: v.id('workflows'),
    /** The run's overall state, held for its whole duration so the run button
     * doesn't flicker between per-node status updates: 'scheduled' (queued as a
     * later step of another workflow's chain), 'running' (executing). Absent
     * means idle. */
    phase: v.optional(v.union(v.literal('scheduled'), v.literal('running'))),
    nodeStatuses: v.record(
      v.string(),
      v.union(v.literal('running'), v.literal('success'), v.literal('error'))
    ),
    nodeOutputs: v.record(v.string(), v.string()),
  }).index('workflow', ['workflowId']),

  /** One permanent record per run: a snapshot of the canvas as it ran, plus
   * the final outcome. Powers the run history view. */
  runHistory: defineTable({
    workflowId: v.id('workflows'),
    canvas: workflowCanvasValidator,
    status: v.union(
      v.literal('running'),
      v.literal('success'),
      v.literal('error'),
      v.literal('stopped')
    ),
    stopRequested: v.optional(v.boolean()),
    nodeStatuses: v.optional(
      v.record(
        v.string(),
        v.union(v.literal('running'), v.literal('success'), v.literal('error'))
      )
    ),
    nodeOutputs: v.record(v.string(), v.string()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
  }).index('workflow', ['workflowId']),

  workflows: defineTable({
    workspaceId: v.id('workspaces'),
    name: v.string(),
    description: v.optional(v.string()),
    isPublished: v.boolean(),
    folderId: v.optional(v.id('folders')),
    ownerId: v.id('users'),
    canvas: workflowCanvasValidator,
    /** Secret token in the workflow's inbound webhook URL; set when a member
     * enables the webhook. Unguessable, so the URL itself is the credential. */
    webhookToken: v.optional(v.string()),
    /** Ordered ids of workflows to run, one after another, when this workflow's
     * chain is run. Empty/absent means no chain configured. */
    chainWorkflowIds: v.optional(v.array(v.id('workflows'))),
    runCount: v.number(),
    successCount: v.number(),
    failCount: v.number(),
    lastRunAt: v.optional(v.number()),
    lastRunStatus: v.optional(
      v.union(v.literal('success'), v.literal('error'), v.literal('stopped'))
    ),
    updatedAt: v.number(),
  })
    .index('workspaceId', ['workspaceId'])
    .index('workspaceName', ['workspaceId', 'name'])
    .index('folder', ['workspaceId', 'folderId'])
    .index('webhookToken', ['webhookToken']),

  files: defineTable({
    workspaceId: v.id('workspaces'),
    name: v.string(),
    folderId: v.optional(v.id('folders')),
    // Absent until the upload finishes (chunked uploads assemble it late).
    storageId: v.optional(v.id('_storage')),
    size: v.number(),
    contentType: v.string(),
    status: v.union(
      // Transfer + reassembly phases, before the file blob exists.
      v.literal('uploading'),
      v.literal('assembling'),
      // Post-upload indexing pipeline.
      v.literal('processing'),
      v.literal('indexed'),
      v.literal('failed')
    ),
    progress: v.optional(v.number()),
    // Temporary per-chunk blobs for an in-progress chunked upload; cleared
    // once reassembled.
    chunks: v.optional(v.array(v.id('_storage'))),
    uploadedBy: v.id('users'),
    updatedAt: v.number(),
  })
    .index('workspaceId', ['workspaceId'])
    .index('workspaceName', ['workspaceId', 'name'])
    .index('folder', ['workspaceId', 'folderId']),
});
