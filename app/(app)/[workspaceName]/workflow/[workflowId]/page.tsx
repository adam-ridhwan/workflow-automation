import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { RunWorkflowButton } from './_components/header/run-workflow-button';
import { WorkflowCanvas } from './_components/workflow/workflow-canvas';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

type WorkflowPageProps = {
  params: Promise<{ workspaceName: string; workflowId: Id<'workflows'> }>;
};

export default async function WorkflowPage({ params }: WorkflowPageProps) {
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

        <div className='ml-auto'>
          <RunWorkflowButton />
        </div>
      </div>

      <WorkflowCanvas canvas={workflow.canvas} />
    </div>
  );
}
