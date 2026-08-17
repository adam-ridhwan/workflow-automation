'use server';

import { revalidatePath } from 'next/cache';

import type { Folder } from '@/convex/folders';

import type { Id } from '@/convex/_generated/dataModel';
/** Invalidate the server-rendered workflows list (root, and the containing
 * folder when given) so a newly created workflow appears when the user returns
 * to it after jumping straight to its canvas. */
export async function revalidateWorkflows(
  workspaceId: Id<'workspaces'>,
  folderId?: Folder['_id']
) {
  revalidatePath(`/workspace/${workspaceId}/workflows`);
  if (folderId) {
    revalidatePath(`/workspace/${workspaceId}/workflows/folder/${folderId}`);
  }
}
