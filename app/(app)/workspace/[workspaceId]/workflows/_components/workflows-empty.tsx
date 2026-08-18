'use client';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { PlusIcon, WorkflowIcon } from 'lucide-react';
import Link from 'next/link';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

export function WorkflowsEmpty() {
  const { workspaceId } = useWorkspaceParams();
  const createHref = `/workspace/${workspaceId}/workflow/create`;

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <WorkflowIcon />
        </EmptyMedia>
        <EmptyTitle>No workflows yet</EmptyTitle>
        <EmptyDescription>
          Create your first workflow to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size='sm'
          nativeButton={false}
          render={<Link href={createHref} />}
        >
          <PlusIcon />
          New workflow
        </Button>
      </EmptyContent>
    </Empty>
  );
}
