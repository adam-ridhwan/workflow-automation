'use client';

import { useState } from 'react';

import { ResourceTable } from '../../_components/resource-table';
import { DeleteWorkflowDialog } from './delete-workflow-dialog';
import { WorkflowRow } from './workflows-table-row-workflow';

import type { Folder } from '@/convex/folders';
import type { Workflow } from '@/convex/workflows';

type WorkflowsTableProps = {
  workflows: Workflow[];
  folders?: Folder[];
  isFiltered: boolean;
};

export function WorkflowsTable({
  workflows,
  folders = [],
  isFiltered,
}: WorkflowsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

  return (
    <>
      <ResourceTable
        folders={folders}
        itemCount={workflows.length}
        itemNoun='workflow'
        itemNounPlural='workflows'
        isFiltered={isFiltered}
        emptyMessage='No workflows yet. Create your first one.'
      >
        {workflows.map((workflow) => (
          <WorkflowRow
            key={workflow._id}
            workflow={workflow}
            onDelete={() => {
              setDeleteTarget(workflow);
            }}
          />
        ))}
      </ResourceTable>

      <DeleteWorkflowDialog
        workflow={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
