import { ConvexError, Infer, v } from 'convex/values';

import { internalQuery, mutation, query } from './_generated/server';
import { decryptSecret, encryptSecret } from './model/secretCrypto';
import {
  getMemberWorkspaceById,
  getWorkspaceByIdOrThrow,
  requireOwner,
  requireUserId,
} from './workspaces';

const secretMetadataValidator = v.object({
  _id: v.id('workspaceSecrets'),
  _creationTime: v.number(),
  name: v.string(),
  last4: v.string(),
  createdBy: v.id('users'),
  updatedAt: v.number(),
});

export type SecretMetadata = Infer<typeof secretMetadataValidator>;

const NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

/** A workspace's secrets as metadata only — never the plaintext. Any member may
 * see which secrets exist and their masked preview. */
export const list = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.array(secretMetadataValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('workspaceSecrets')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    return rows
      .map((row) => ({
        _id: row._id,
        _creationTime: row._creationTime,
        name: row.name,
        last4: row.last4,
        createdBy: row.createdBy,
        updatedAt: row.updatedAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Creates or replaces a secret. Owner-only. The value is encrypted before it
 * touches the database; only its last 4 chars are kept in the clear. */
export const set = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    name: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByIdOrThrow(ctx, args.workspaceId);
    await requireOwner(ctx, workspace._id);
    const userId = await requireUserId(ctx);

    const name = args.name.trim();
    if (name === '' || name.length > 64 || !NAME_PATTERN.test(name)) {
      throw new ConvexError(
        'Name must be 1–64 characters: letters, numbers, and _ . - only.'
      );
    }
    // Trim stray whitespace/newlines from a pasted key — a trailing newline is a
    // common cause of "invalid api key" errors from providers.
    const secretValue = args.value.trim();
    if (secretValue === '') {
      throw new ConvexError('The secret value cannot be empty.');
    }

    const { ciphertext, iv } = await encryptSecret(secretValue);
    const last4 = secretValue.slice(-4);

    const existing = await ctx.db
      .query('workspaceSecrets')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspace._id).eq('name', name)
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert('workspaceSecrets', {
        workspaceId: workspace._id,
        name,
        ciphertext,
        iv,
        last4,
        createdBy: userId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existing._id, {
        ciphertext,
        iv,
        last4,
        createdBy: userId,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/** Deletes a secret. Owner-only. */
export const remove = mutation({
  args: { workspaceId: v.id('workspaces'), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByIdOrThrow(ctx, args.workspaceId);
    await requireOwner(ctx, workspace._id);
    const existing = await ctx.db
      .query('workspaceSecrets')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspace._id).eq('name', args.name)
      )
      .unique();
    if (existing !== null) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

/** Decrypts a workflow's workspace secret by name, for the runner. Internal —
 * never exposed to clients. Returns null when no such secret exists. */
export const resolveForWorkflow = internalQuery({
  args: { workflowId: v.id('workflows'), name: v.string() },
  returns: v.union(v.null(), v.string()),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null) {
      return null;
    }
    const secret = await ctx.db
      .query('workspaceSecrets')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workflow.workspaceId).eq('name', args.name)
      )
      .unique();
    if (secret === null) {
      return null;
    }
    return await decryptSecret({
      ciphertext: secret.ciphertext,
      iv: secret.iv,
    });
  },
});
