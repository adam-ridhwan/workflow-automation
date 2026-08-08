import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

import { RunWorkflowButton } from './_components/header/run-workflow-button';
import { UndoRedoButtons } from './_components/header/undo-redo-buttons';
import { WorkflowTabs } from './_components/header/workflow-tabs';
import { WorkflowTitle } from './_components/header/workflow-title';

import type { Id } from '@/convex/_generated/dataModel';

type WorkflowLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceName: string; workflowId: string }>;
};

export default async function WorkflowLayout({
  children,
  params,
}: WorkflowLayoutProps) {
  // Only the params are awaited here (fast) so the header chrome paints right
  // away; the title fetch streams in via Suspense below.
  const { workspaceName, workflowId } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div
        className='bg-background relative flex h-13 shrink-0 items-center gap-3
          border-b px-2'
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

        <Suspense fallback={<Skeleton className='h-4 w-40' />}>
          <WorkflowTitle
            workspaceName={decodedWorkspaceName}
            workflowId={workflowId as Id<'workflows'>}
          />
        </Suspense>

        <WorkflowTabs />

        <div className='ml-auto flex items-center gap-2'>
          <UndoRedoButtons />
          <RunWorkflowButton />
        </div>
      </div>

      {children}
    </div>
  );
}
