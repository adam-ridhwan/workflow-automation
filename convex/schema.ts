import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

import { workflowCanvasValidator } from './canvas';

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
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

  folders: defineTable({
    workspaceId: v.id('workspaces'),
    name: v.string(),
    parentId: v.optional(v.id('folders')),
    createdBy: v.id('users'),
  })
    .index('workspaceId', ['workspaceId'])
    .index('parent', ['workspaceId', 'parentId'])
    .index('parentName', ['workspaceId', 'parentId', 'name']),

  workflows: defineTable({
    workspaceId: v.id('workspaces'),
    name: v.string(),
    description: v.optional(v.string()),
    isPublished: v.boolean(),
    folderId: v.optional(v.id('folders')),
    ownerId: v.id('users'),
    canvas: workflowCanvasValidator,
    runCount: v.number(),
    successCount: v.number(),
    failCount: v.number(),
    updatedAt: v.number(),
  })
    .index('workspaceId', ['workspaceId'])
    .index('workspaceName', ['workspaceId', 'name'])
    .index('folder', ['workspaceId', 'folderId']),
});
