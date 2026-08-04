'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Panel, useReactFlow, useViewport } from '@xyflow/react';
import { MinusIcon, NetworkIcon, PlusIcon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

const ZOOM_PRESETS = [0.5, 1, 2];

export function CanvasPalette() {
  const workspaceName = useWorkspaceName();
  const workflowId = useWorkflowId();
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const organizeNodes = useCanvasStore((s) => s.organizeNodes);

  return (
    <Panel position='bottom-center'>
      <div
        className='menu-inverted bg-popover text-popover-foreground
          ring-foreground/10 flex items-center gap-1 rounded-lg p-1 shadow-md
          ring-1 backdrop-blur-xl'
      >
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='text-primary'
          aria-label='Zoom out'
          onClick={() => {
            zoomOut({ duration: 200 });
          }}
        >
          <MinusIcon />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='text-primary'
                aria-label='Zoom level'
              />
            }
          >
            {Math.round(zoom * 100)}%
          </DropdownMenuTrigger>
          <DropdownMenuContent side='top' align='center' className='w-32'>
            {ZOOM_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => {
                  zoomTo(preset);
                }}
              >
                {preset * 100}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                fitView();
              }}
            >
              Zoom to fit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='text-primary'
          aria-label='Zoom in'
          onClick={() => {
            zoomIn({ duration: 200 });
          }}
        >
          <PlusIcon />
        </Button>

        <Separator
          orientation='vertical'
          className='mx-0.5 data-vertical:h-4 data-vertical:self-auto'
        />

        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='text-primary'
          aria-label='Auto layout'
          onClick={() => {
            organizeNodes({ workspaceName, workflowId });
          }}
        >
          <NetworkIcon />
        </Button>
      </div>
    </Panel>
  );
}
