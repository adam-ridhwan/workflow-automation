'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';

import { DeleteWorkflowDialog } from './delete-workflow-dialog';
import { WorkflowsTableBody } from './workflows-table-body';
import { WorkflowsTableHeader } from './workflows-table-header';

import type { Workflow } from '@/convex/workflows';

type WorkflowsTableProps = {
  workflows: Workflow[];
  workspaceName: string;
  isFiltered: boolean;
};

export function WorkflowsTable({
  workflows,
  workspaceName,
  isFiltered,
}: WorkflowsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

  return (
    <div className='flex flex-1 flex-col'>
      <Table className='table-fixed'>
        <WorkflowsTableHeader />
        <WorkflowsTableBody
          workflows={workflows}
          workspaceName={workspaceName}
          isFiltered={isFiltered}
          onDelete={setDeleteTarget}
        />
      </Table>

      <div
        className='text-muted-foreground mt-auto flex h-10.5 items-center
          justify-between border-t px-5 text-[11.5px]'
      >
        <span>
          {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}{' '}
          in {workspaceName}
        </span>
      </div>

      <DeleteWorkflowDialog
        workspaceName={workspaceName}
        workflow={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
