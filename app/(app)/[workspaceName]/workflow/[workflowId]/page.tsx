import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { WorkflowCanvas } from './_components/workflow-canvas';
import { WorkflowProvider } from './_components/workflow-provider';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

type WorkflowPageProps = {
  params: Promise<{ workspaceName: string; workflowId: Id<'workflows'> }>;
};

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  await new Promise((resolve) => setTimeout(resolve, 2500)); // TEMP: repro loading state
  const { workspaceName, workflowId } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  let workflow: Workflow | null = null;
  try {
    workflow = await fetchQuery(
      api.workflows.get,
      {
        workspaceName: decodedWorkspaceName,
        workflowId: workflowId,
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
        className='bg-background flex h-13 shrink-0 items-center gap-3 border-b
          px-2'
      >
        <Button
          variant='ghost'
          size='icon'
          nativeButton={false}
          className='text-muted-foreground hover:text-foreground'
          render={
            <Link
              href={`/${encodeURIComponent(decodedWorkspaceName)}/workflows`}
              aria-label='Back to workflows'
            />
          }
        >
          <ArrowLeftIcon className='size-4' />
        </Button>

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
          <span className='size-1.25 rounded-full bg-current' />
          <span>{workflow.isPublished ? 'Published' : 'Unpublished'}</span>
        </span>
      </div>

      <WorkflowCanvas canvas={workflow.canvas} />
    </div>
  );
}
