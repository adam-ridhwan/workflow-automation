'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import {
  BlendIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

import type { Id } from '@/convex/_generated/dataModel';

type WorkflowChainMenuProps = {
  /** The current workflow's chain, in run order. */
  chainWorkflowIds: Id<'workflows'>[];
};

/** Header control for a workflow's "chain": an ordered list of other workflows
 * that run automatically, one after another, after this workflow finishes a
 * "Run Workflow". Add, remove, and reorder them here. */
export function WorkflowChainMenu({
  chainWorkflowIds,
}: WorkflowChainMenuProps) {
  const pathname = usePathname();
  const { workspaceName, workflowId } = useWorkspaceParams();
  const options = useQuery(api.workflows.otherWorkflows, {
    workspaceName,
    workflowId,
  });
  const setChain = useMutation(api.workflows.setChain);

  if (!pathname.endsWith('/canvas')) {
    return null;
  }

  const nameById = new Map((options ?? []).map((o) => [o._id, o.name]));
  // Drop any ids whose workflow was deleted, so the list only shows real ones.
  const chain = chainWorkflowIds.filter((id) => nameById.has(id));
  const chainSet = new Set(chain);
  const available = (options ?? []).filter((o) => !chainSet.has(o._id));

  async function save(next: Id<'workflows'>[]) {
    try {
      await setChain({ workspaceName, workflowId, chainWorkflowIds: next });
    } catch {
      toast.add({ type: 'error', title: 'Could not update the chain.' });
    }
  }

  function add(id: Id<'workflows'>) {
    save([...chain, id]);
  }

  function remove(id: Id<'workflows'>) {
    save(chain.filter((existing) => existing !== id));
  }

  function move(index: number, delta: number) {
    const next = [...chain];
    const target = index + delta;
    if (target < 0 || target >= next.length) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Workflow chain'
                />
              }
            >
              <BlendIcon className='size-4' />
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent>Workflow chain</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align='end' className='w-72'>
        <div className='px-2 py-1.5'>
          <p className='text-[13px] font-medium'>Run after this workflow</p>
          <p className='text-muted-foreground text-[11px]'>
            When you run this workflow, these run next, in order.
          </p>
        </div>

        <DropdownMenuSeparator />

        {/* The ordered chain. */}
        {chain.length === 0 ? (
          <div className='text-muted-foreground px-2 py-1.5 text-xs'>
            No workflows in the chain yet. Add one below.
          </div>
        ) : (
          <div className='flex flex-col'>
            {chain.map((id, index) => (
              <div key={id} className='flex items-center gap-1.5 px-2 py-1'>
                <span
                  className='text-muted-foreground w-4 shrink-0 text-[11px]
                    tabular-nums'
                >
                  {index + 1}.
                </span>
                <span className='flex-1 truncate text-[13px]'>
                  {nameById.get(id)}
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-6'
                  aria-label='Move up'
                  disabled={index === 0}
                  onClick={() => {
                    move(index, -1);
                  }}
                >
                  <ChevronUpIcon className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-6'
                  aria-label='Move down'
                  disabled={index === chain.length - 1}
                  onClick={() => {
                    move(index, 1);
                  }}
                >
                  <ChevronDownIcon className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-muted-foreground size-6'
                  aria-label='Remove from chain'
                  onClick={() => {
                    remove(id);
                  }}
                >
                  <XIcon className='size-3.5' />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        {/* Add a workflow to the chain. */}
        <div className='px-2 py-1'>
          <p className='text-muted-foreground mb-1 text-[11px] font-medium'>
            Add workflow
          </p>
          {options === undefined ? (
            <div className='text-muted-foreground py-1 text-xs'>Loading…</div>
          ) : available.length === 0 ? (
            <div className='text-muted-foreground py-1 text-xs'>
              {chain.length === 0
                ? 'No other workflows in this workspace.'
                : 'Every other workflow is already in the chain.'}
            </div>
          ) : (
            <div className='-mx-1 max-h-48 overflow-y-auto'>
              {available.map((option) => (
                <button
                  key={option._id}
                  type='button'
                  onClick={() => {
                    add(option._id);
                  }}
                  className='hover:bg-accent flex w-full items-center gap-1.5
                    rounded-md px-2 py-1 text-left text-[13px]'
                >
                  <PlusIcon className='text-muted-foreground size-3.5 shrink-0' />
                  <span className='truncate'>{option.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
