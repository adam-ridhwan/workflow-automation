'use client';

import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { ResourceTable } from '../../_components/resource-table';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { DeleteWorkflowDialog } from './delete-workflow-dialog';
import { WorkflowsTableRow } from './workflows-table-row';

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
  const { workspaceId } = useWorkspaceParams();
  const phases = useQuery(api.runs.phasesByWorkspace, { workspaceId });

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
          <WorkflowsTableRow
            key={workflow._id}
            workflow={workflow}
            phase={phases?.[workflow._id]}
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
