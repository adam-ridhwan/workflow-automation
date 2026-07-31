'use client';

import { useState } from 'react';
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

import { NewWorkflowDialog } from './new-workflow-dialog';

type WorkflowsEmptyProps = {
  workspaceName: string;
};

export function WorkflowsEmpty({ workspaceName }: WorkflowsEmptyProps) {
  const [showNewDialog, setShowNewDialog] = useState(false);

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
          onClick={() => {
            setShowNewDialog(true);
          }}
        >
          <PlusIcon />
          New workflow
        </Button>
      </EmptyContent>

      <NewWorkflowDialog
        workspaceName={workspaceName}
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </Empty>
  );
}
