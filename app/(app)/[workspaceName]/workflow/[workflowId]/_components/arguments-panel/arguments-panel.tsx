'use client';

import { Separator } from '@/components/ui/separator';
import { SlidersHorizontalIcon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { ArgumentsPanelBody } from './arguments-panel-body';
import { ArgumentsPanelFooter } from './arguments-panel-footer';

/** Floating panel in the top-right corner of the canvas; edits the selected
 * node's arguments. Hidden while no node is selected. */
export function ArgumentsPanel() {
  const selectedNode = useCanvasStore((s) =>
    s.nodes.find((node) => node.selected)
  );

  if (!selectedNode) {
    return null;
  }

  return (
    <div
      className='menu-inverted bg-popover text-popover-foreground
        ring-foreground/10 absolute top-4 right-4 z-10 flex w-80 flex-col
        rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl'
    >
      <div
        className='flex w-full items-center gap-2 px-2 py-1.5 text-[13px]
          font-medium select-none'
      >
        <SlidersHorizontalIcon
          className='text-muted-foreground size-3.5 shrink-0'
        />
        Arguments
      </div>

      <ArgumentsPanelBody selectedNode={selectedNode} />

      <Separator className='-mx-1 my-1 w-auto' />

      <ArgumentsPanelFooter selectedNode={selectedNode} />
    </div>
  );
}
