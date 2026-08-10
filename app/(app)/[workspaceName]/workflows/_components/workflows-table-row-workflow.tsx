'use client';

import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format-time';
import { useMutation } from 'convex/react';
import { WorkflowIcon } from 'lucide-react';

import { ResourceRowShell } from '../../_components/resource-row-shell';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { Workflow } from '@/convex/workflows';

type WorkflowRowProps = {
  workflow: Workflow;
  onDelete: () => void;
};

export function WorkflowRow({ workflow, onDelete }: WorkflowRowProps) {
  const { workspaceName } = useWorkspaceParams();
  const renameWorkflow = useMutation(api.workflows.rename);

  return (
    <ResourceRowShell
      drag={{ kind: 'workflow', id: workflow._id, name: workflow.name }}
      href={`/${encodeURIComponent(workspaceName)}/workflow/${workflow._id}/canvas`}
      icon={<WorkflowIcon className='text-muted-foreground size-4 shrink-0' />}
      name={workflow.name}
      subtitle={workflow.description}
      onRename={(name) =>
        renameWorkflow({ workspaceName, workflowId: workflow._id, name })
      }
      renameLabel='Rename workflow'
      renameErrorFallback='Could not rename workflow. Please try again.'
      deleteLabel='Delete workflow'
      onDelete={onDelete}
      cells={
        <>
          <TableCell className='px-5'>
            <Badge
              variant='secondary'
              className={cn(
                'gap-1.5 rounded-full',
                workflow.isPublished
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <span className='size-1.25 rounded-full bg-current' />
              {workflow.isPublished ? 'Published' : 'Unpublished'}
            </Badge>
          </TableCell>

          <TableCell className='text-muted-foreground px-5 text-xs'>
            {formatTime(workflow._creationTime)}
          </TableCell>

          <TableCell className='px-5'>
            <span className='flex min-w-0 items-center gap-2'>
              <UserAvatar
                user={{
                  name: workflow.ownerName,
                  email: workflow.ownerEmail,
                  avatar: workflow.ownerImageUrl ?? undefined,
                }}
                size='sm'
                className='relative'
                fallbackClassName='text-[10px] font-semibold'
              />
              <span className='truncate text-xs'>{workflow.ownerName}</span>
            </span>
          </TableCell>
        </>
      }
    />
  );
}
