'use server';

import { revalidatePath } from 'next/cache';

import type { Folder } from '@/convex/folders';

/** Invalidate the server-rendered workflows list (root, and the containing
 * folder when given) so a newly created workflow appears when the user returns
 * to it after jumping straight to its canvas. */
export async function revalidateWorkflows(
  workspaceName: string,
  folderId?: Folder['_id']
) {
  const slug = encodeURIComponent(workspaceName);
  revalidatePath(`/${slug}/workflows`);
  if (folderId) {
    revalidatePath(`/${slug}/workflows/folder/${folderId}`);
  }
}
