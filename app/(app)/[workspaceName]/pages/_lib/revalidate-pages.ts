'use server';

import { revalidatePath } from 'next/cache';

import type { Folder } from '@/convex/folders';

/** Invalidate the server-rendered pages list (root, and the containing folder
 * when given) so a newly created page appears when the user returns to it after
 * jumping straight to the builder. */
export async function revalidatePages(
  workspaceName: string,
  folderId?: Folder['_id']
) {
  const slug = encodeURIComponent(workspaceName);
  revalidatePath(`/${slug}/pages`);
  if (folderId) {
    revalidatePath(`/${slug}/pages/folder/${folderId}`);
  }
}
