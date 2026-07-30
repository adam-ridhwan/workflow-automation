import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { formatCreated } from '@/lib/format-created-time';
import { getInitials } from '@/lib/get-initials';
import Link from 'next/link';

import type { Workflow } from '@/convex/queries/workflows';

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={cn(
        `inline-flex h-5 w-fit items-center gap-1.5 rounded-full px-2
        text-[11px] font-semibold`,
        isPublished
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span className='size-[5px] rounded-full bg-current' />
      <span>{isPublished ? 'Live' : 'Canvas'}</span>
    </span>
  );
}

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
  return (
    <div className='flex flex-1 flex-col'>
      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead
              className='text-muted-foreground h-9 px-4 text-[11px] font-medium
                tracking-wider uppercase'
            >
              Workflow
            </TableHead>
            <TableHead
              className='text-muted-foreground h-9 w-30 px-4 text-[11px]
                font-medium tracking-wider uppercase'
            >
              Status
            </TableHead>
            <TableHead
              className='text-muted-foreground h-9 w-30 px-4 text-[11px]
                font-medium tracking-wider uppercase'
            >
              Created
            </TableHead>
            <TableHead
              className='text-muted-foreground h-9 w-16 px-4 text-[11px]
                font-medium tracking-wider uppercase'
            >
              Owner
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {workflows.length === 0 ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={4}
                className='text-muted-foreground h-24 px-4 text-center
                  text-[13px]'
              >
                {isFiltered
                  ? 'No workflows match your filters.'
                  : 'No workflows yet. Create your first one.'}
              </TableCell>
            </TableRow>
          ) : (
            workflows.map((workflow) => (
              <TableRow key={workflow._id} className='relative'>
                <TableCell className='px-4 py-3'>
                  <Link
                    href={`/${encodeURIComponent(workspaceName)}/workflows/${workflow._id}`}
                    aria-label={workflow.name}
                    className='absolute inset-0'
                  />
                  <span className='flex min-w-0 flex-col gap-0.5'>
                    <span
                      className='truncate text-[13.5px] font-semibold
                        tracking-tight'
                    >
                      {workflow.name}
                    </span>
                    {workflow.description && (
                      <span className='text-muted-foreground truncate text-xs'>
                        {workflow.description}
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className='px-4'>
                  <StatusBadge isPublished={workflow.isPublished} />
                </TableCell>
                <TableCell className='text-muted-foreground px-4 text-xs'>
                  {formatCreated(workflow._creationTime)}
                </TableCell>
                <TableCell className='px-4'>
                  <Avatar size='sm' title={workflow.createdByName}>
                    <AvatarFallback className='text-[10px] font-semibold'>
                      {getInitials(workflow.createdByName)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div
        className='text-muted-foreground mt-auto flex h-[42px] items-center
          justify-between border-t px-4 text-[11.5px]'
      >
        <span>
          {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}{' '}
          in {workspaceName}
        </span>
      </div>
    </div>
  );
}
