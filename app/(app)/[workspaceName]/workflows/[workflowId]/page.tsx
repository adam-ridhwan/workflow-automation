import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatCreated } from '@/lib/format-created-time';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/queries/workflows';

type WorkflowPageProps = {
  params: Promise<{ workspaceName: string; workflowId: string }>;
};

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workspaceName, workflowId } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  let workflow: Workflow | null = null;
  try {
    workflow = await fetchQuery(
      api.queries.workflows.get,
      {
        workspaceName: decodedWorkspaceName,
        workflowId: workflowId as Id<'workflows'>,
      },
      { token }
    );
  } catch {
    notFound();
  }
  if (workflow === null) {
    notFound();
  }

  return (
    <div className='flex flex-1 flex-col'>
      <div
        className='bg-background flex h-[52px] shrink-0 items-center gap-3
          border-b px-5'
      >
        <Link
          href={`/${encodeURIComponent(decodedWorkspaceName)}/workflows`}
          className='text-muted-foreground hover:text-foreground flex size-7
            items-center justify-center rounded-md transition-colors'
          aria-label='Back to workflows'
        >
          <ArrowLeftIcon className='size-4' />
        </Link>
        <span className='text-[13.5px] font-semibold tracking-tight'>
          {workflow.name}
        </span>
        <span
          className={cn(
            `inline-flex h-5 w-fit items-center gap-1.5 rounded-full px-2
            text-[11px] font-semibold`,
            workflow.isPublished
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <span className='size-[5px] rounded-full bg-current' />
          <span>{workflow.isPublished ? 'Live' : 'Unpublished'}</span>
        </span>
      </div>

      <div className='flex flex-col gap-2 p-5'>
        {workflow.description && (
          <p className='text-muted-foreground text-sm'>
            {workflow.description}
          </p>
        )}
        <p className='text-muted-foreground text-xs'>
          Created by {workflow.createdByName} ·{' '}
          {formatCreated(workflow._creationTime)}
        </p>
      </div>
    </div>
  );
}
