import { api } from '@/convex/_generated/api';
import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound, redirect } from 'next/navigation';

import { PublishedPageView } from './_components/published-page-view';

import type { Id } from '@/convex/_generated/dataModel';

type PublishedPageProps = {
  params: Promise<{ pageId: string }>;
};

/** Standalone published view of a page — no app chrome. Viewable only by a
 * signed-in member of the owning workspace (enforced by `getPublished`); anyone
 * else gets a 404, and signed-out visitors are sent to sign in. */
export default async function PublishedPage({ params }: PublishedPageProps) {
  const { pageId } = await params;

  if (!(await isAuthenticatedNextjs())) {
    redirect('/signin');
  }

  const token = await convexAuthNextjsToken();
  const page = await fetchQuery(
    api.pages.getPublished,
    { pageId: pageId as Id<'pages'> },
    { token }
  ).catch(() => null);

  if (!page) {
    notFound();
  }

  const fileOptions = await fetchQuery(
    api.pages.fileOptions,
    { workspaceId: page.workspaceId },
    { token }
  );

  return <PublishedPageView page={page} fileOptions={fileOptions} />;
}
