import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from './_generated/server';

import type { Doc } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

const userValidator = v.object({
  _id: v.id('users'),
  _creationTime: v.number(),
  name: v.string(),
  image: v.optional(v.string()),
  imageStorageId: v.optional(v.id('_storage')),
  /** Resolved picture to display: the uploaded avatar, else the provider
   * image, else null. */
  imageUrl: v.union(v.null(), v.string()),
  email: v.string(),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
});

export type User = Infer<typeof userValidator>;

async function requireUserId(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError('You must be signed in.');
  }
  return userId;
}

/** The picture to display for a user: their uploaded avatar, else the provider
 * image, else null. Shared by every query that returns user identity. */
export async function resolveUserImageUrl(
  ctx: QueryCtx | MutationCtx,
  user: Doc<'users'> | null
): Promise<string | null> {
  if (user === null) {
    return null;
  }
  return user.imageStorageId
    ? await ctx.storage.getUrl(user.imageStorageId)
    : (user.image ?? null);
}

export const currentUser = query({
  args: {},
  returns: v.union(v.null(), userValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (user === null) {
      return null;
    }
    return { ...user, imageUrl: await resolveUserImageUrl(ctx, user) };
  },
});

/** Rename the signed-in user. */
export const updateName = mutation({
  args: { name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Name is required.');
    }
    await ctx.db.patch(userId, { name });
    return null;
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Set the signed-in user's profile picture from an uploaded storage object. */
export const setAvatar = mutation({
  args: { storageId: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.imageStorageId) {
      await ctx.storage.delete(user.imageStorageId);
    }
    await ctx.db.patch(userId, { imageStorageId: args.storageId });
    return null;
  },
});

/** Remove the uploaded profile picture. */
export const removeAvatar = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (user?.imageStorageId) {
      await ctx.storage.delete(user.imageStorageId);
    }
    await ctx.db.patch(userId, { imageStorageId: undefined });
    return null;
  },
});

/** Whether an account already exists for this email. Used by the sign-up form
 * to warn before attempting a duplicate password sign-up. */
export const emailExists = query({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.email.trim()))
      .first();
    return user !== null;
  },
});
