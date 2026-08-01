'use client';

import { TableBody, TableCell, TableRow } from '@/components/ui/table';

import { FolderRow } from './workflows-table-row-folder';
import { WorkflowRow } from './workflows-table-row-workflow';

import type { DragData } from './workflows-table';
import type { Folder } from '@/convex/folders';
import type { Workflow } from '@/convex/workflows';

type WorkflowsTableBodyProps = {
  workflows: Workflow[];
  folders?: Folder[];
  workspaceName: string;
  isFiltered: boolean;
  dragItem: DragData | null;
  onDelete: (workflow: Workflow) => void;
  onDeleteFolder: (folder: Folder) => void;
};

export function WorkflowsTableBody({
  workflows,
  folders = [],
  workspaceName,
  isFiltered,
  dragItem,
  onDelete,
  onDeleteFolder,
}: WorkflowsTableBodyProps) {
  if (workflows.length === 0 && folders.length === 0) {
    return (
      <TableBody>
        <TableRow className='hover:bg-transparent'>
          <TableCell
            colSpan={5}
            className='text-muted-foreground h-24 px-5 text-center text-[13px]'
          >
            {isFiltered
              ? 'Nothing matches your search or filters. Try broadening or clearing them.'
              : 'No workflows yet. Create your first one.'}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {folders.map((folder) => (
        <FolderRow
          key={folder._id}
          folder={folder}
          workspaceName={workspaceName}
          dragItem={dragItem}
          onDelete={() => {
            onDeleteFolder(folder);
          }}
        />
      ))}
      {workflows.map((workflow) => (
        <WorkflowRow
          key={workflow._id}
          workflow={workflow}
          workspaceName={workspaceName}
          onDelete={() => {
            onDelete(workflow);
          }}
        />
      ))}
    </TableBody>
  );
}
