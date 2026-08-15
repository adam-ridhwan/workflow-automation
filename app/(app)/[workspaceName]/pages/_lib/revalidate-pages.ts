'use server';

import { revalidatePath } from 'next/cache';

/** Invalidate the server-rendered pages list so a newly created page appears
 * when the user returns to it after jumping straight to the builder. */
export async function revalidatePages(workspaceName: string) {
  const slug = encodeURIComponent(workspaceName);
  revalidatePath(`/${slug}/pages`);
}
