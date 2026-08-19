'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NODE_SPECS } from '@/lib/node-specs';
import { ChevronDownIcon, LayersIcon } from 'lucide-react';

import { NodePaletteItem } from './node-palette-item';

const GROUP_LABELS: Record<string, string> = {
  INPUT: 'Input',
  MODEL: 'Model',
  LOGIC: 'Logic',
  OUTPUT: 'Output',
};

/** Floating list of node specs in the top-left corner of the canvas; drag
 * an item onto the canvas to add it. */
export function NodePalette() {
  return (
    <Collapsible
      defaultOpen
      data-node-palette
      className='menu-inverted bg-popover text-popover-foreground
        ring-foreground/10 absolute top-4 left-4 z-10 flex w-44 flex-col
        rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl'
    >
      <CollapsibleTrigger
        className='group/palette hover:bg-accent hover:text-accent-foreground
          flex w-full cursor-pointer items-center justify-between rounded-md
          px-2 py-1.5 text-[13px] font-medium select-none'
      >
        <span className='flex items-center gap-2'>
          <LayersIcon className='text-muted-foreground size-3.5 shrink-0' />
          Nodes
        </span>
        <ChevronDownIcon
          className='text-muted-foreground size-3.5 shrink-0
            transition-transform group-data-panel-open/palette:rotate-180'
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        className='flex h-(--collapsible-panel-height) flex-col gap-1
          overflow-hidden transition-[height] duration-200 ease-out
          data-ending-style:h-0 data-starting-style:h-0'
      >
        {Object.entries(NODE_SPECS).map(([group, specs]) => (
          <div key={group}>
            <div
              className='text-muted-foreground px-2 pt-1.5 pb-1 text-[10.5px]
                font-medium tracking-wider uppercase'
            >
              {GROUP_LABELS[group] ?? group}
            </div>
            {Object.values(specs).map((spec) => (
              <NodePaletteItem
                key={spec.node_info.node_uid}
                uid={spec.node_info.node_uid}
              />
            ))}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
