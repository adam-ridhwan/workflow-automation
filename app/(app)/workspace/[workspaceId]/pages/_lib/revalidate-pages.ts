'use server';

import { revalidatePath } from 'next/cache';

import type { Folder } from '@/convex/folders';

import type { Id } from '@/convex/_generated/dataModel';
/** Invalidate the server-rendered pages list (root, and the containing folder
 * when given) so a newly created page appears when the user returns to it after
 * jumping straight to the builder. */
export async function revalidatePages(
  workspaceId: Id<'workspaces'>,
  folderId?: Folder['_id']
) {
  revalidatePath(`/workspace/${workspaceId}/pages`);
  if (folderId) {
    revalidatePath(`/workspace/${workspaceId}/pages/folder/${folderId}`);
  }
}
