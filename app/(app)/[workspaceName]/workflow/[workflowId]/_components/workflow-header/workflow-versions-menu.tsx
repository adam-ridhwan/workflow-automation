'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { formatTime } from '@/lib/format-time';
import { getInitials } from '@/lib/get-initials';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { HistoryIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { toFlowEdges, toFlowNodes } from '../../_lib/normalize';
import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

import type { Id } from '@/convex/_generated/dataModel';

type Version = {
  kind: 'auto' | 'manual' | 'restored';
  name: string | null;
};

function versionLabel(version: Version) {
  if (version.kind === 'manual') {
    return version.name || 'Manual save';
  }
  if (version.kind === 'restored') {
    return 'Restored version';
  }
  return 'Auto saved';
}

/** History of saved canvas snapshots, with manual save + restore. Canvas-only,
 * since it applies the restored canvas straight into the editing store. */
export function WorkflowVersionsMenu() {
  const pathname = usePathname();
  const { workspaceName, workflowId } = useWorkspaceParams();
  const versions = useQuery(api.workflows.listWorkflowVersions, {
    workspaceName,
    workflowId,
  });
  const saveVersion = useMutation(api.workflows.saveVersion);
  const restoreVersion = useMutation(api.workflows.restoreVersion);
  const setCanvas = useCanvasStore((s) => s.setCanvas);
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!pathname.endsWith('/canvas')) {
    return null;
  }

  async function handleSaveNamed() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setSaving(true);
    try {
      await saveVersion({ workspaceName, workflowId, name: trimmed });
      setName('');
      toast.add({ type: 'success', title: 'Version saved.' });
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof ConvexError && typeof error.data === 'string'
            ? error.data
            : 'Could not save this version. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(versionId: Id<'workflowVersions'>) {
    try {
      const canvas = await restoreVersion({ workspaceName, versionId });
      setCanvas(toFlowNodes(canvas), toFlowEdges(canvas), canvas.version);
      toast.add({ type: 'success', title: 'Version restored.' });
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof ConvexError && typeof error.data === 'string'
            ? error.data
            : 'Could not restore this version. Please try again.',
      });
    }
  }

  function renderVersions() {
    if (versions === undefined) {
      return (
        <div className='text-muted-foreground px-2 py-1.5 text-xs'>Loading…</div>
      );
    }
    if (versions.length === 0) {
      return (
        <div className='text-muted-foreground px-2 py-1.5 text-xs'>
          No versions yet. They&apos;re captured automatically as you edit.
        </div>
      );
    }
    return versions.map((version) => (
      <DropdownMenuItem
        key={version._id}
        className='gap-2'
        onClick={() => {
          handleRestore(version._id);
        }}
      >
        <Avatar className='size-6'>
          {version.createdByImageUrl && (
            <AvatarImage
              src={version.createdByImageUrl}
              alt={version.createdByName}
            />
          )}
          <AvatarFallback className='text-[9px] font-semibold'>
            {getInitials(version.createdByName)}
          </AvatarFallback>
        </Avatar>
        <div className='flex min-w-0 flex-col'>
          <span className='truncate text-[13px]'>{versionLabel(version)}</span>
          <span className='text-muted-foreground truncate text-[11px]'>
            {version.createdByName} &nbsp; · &nbsp;
            {formatTime(version._creationTime)}
          </span>
        </div>
      </DropdownMenuItem>
    ));
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
                  aria-label='Version history'
                  disabled={isRunning}
                />
              }
            >
              <HistoryIcon className='size-4' />
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent>Version history</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align='end' className='w-72'>
        <div className='flex items-center gap-2 p-2'>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveNamed();
              }
            }}
            placeholder='Name this version…'
            className='h-8'
          />
          <Button
            size='sm'
            disabled={!name.trim() || saving}
            onClick={handleSaveNamed}
          >
            Save
          </Button>
        </div>

        <DropdownMenuSeparator />

        <div className='max-h-80 overflow-y-auto'>{renderVersions()}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
