import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import { PageBuilder } from './_components/page-builder';

import type { Id } from '@/convex/_generated/dataModel';

type PageDetailProps = {
  params: Promise<{ workspaceId: string; pageId: string }>;
};

export default async function PageDetailPage({ params }: PageDetailProps) {
  const { workspaceId: workspaceIdParam, pageId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  const token = await convexAuthNextjsToken();

  const [page, workflowOptions, fileOptions] = await Promise.all([
    fetchQuery(
      api.pages.get,
      { workspaceId: workspaceId, pageId: pageId as Id<'pages'> },
      { token }
    ),
    fetchQuery(
      api.pages.workflowOptions,
      { workspaceId: workspaceId },
      { token }
    ),
    fetchQuery(
      api.pages.fileOptions,
      { workspaceId: workspaceId },
      { token }
    ),
  ]);

  if (page === null) {
    notFound();
  }

  return (
    <PageBuilder
      page={page}
      workflowOptions={workflowOptions}
      fileOptions={fileOptions}
    />
  );
}
