'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { useWorkspaceName } from '@/hooks/use-workspace-name';

import { DeleteFolderDialog } from '../../_components/delete-folder-dialog';
import { DeleteWorkflowDialog } from './delete-workflow-dialog';
import { WorkflowsTableBody } from './workflows-table-body';

import type { Folder } from '@/convex/folders';
import type { Workflow } from '@/convex/workflows';

type WorkflowsTableProps = {
  workflows: Workflow[];
  folders?: Folder[];
  isFiltered: boolean;
};

export function WorkflowsTable({
  workflows,
  folders,
  isFiltered,
}: WorkflowsTableProps) {
  const workspaceName = useWorkspaceName();
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null
  );

  return (
    <div className='flex flex-1 flex-col'>
      <Table className='table-fixed'>
        <colgroup>
          <col />
          <col className='w-[15%]' />
          <col className='w-[15%]' />
          <col className='w-[15%]' />
          <col className='w-[5%]' />
        </colgroup>

        <WorkflowsTableBody
          workflows={workflows}
          folders={folders}
          isFiltered={isFiltered}
          onDelete={setDeleteTarget}
          onDeleteFolder={setFolderDeleteTarget}
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
        workflow={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
      <DeleteFolderDialog
        folder={folderDeleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFolderDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
