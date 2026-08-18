'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDownIcon, LayersIcon } from 'lucide-react';

import { PALETTE_TYPES } from '../_constants/page-component-meta';
import { PagePaletteItem } from './page-palette-item';

/** Floating list of components in the top-left of the canvas; drag an item onto
 * the canvas to add it. Styled like the workflow node palette. */
export function PagePalette() {
  return (
    <Collapsible
      defaultOpen
      data-page-palette
      className='menu-inverted bg-popover text-popover-foreground
        ring-foreground/10 absolute top-4 left-4 z-10 flex w-52 flex-col
        rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl'
    >
      <CollapsibleTrigger
        className='group/palette hover:bg-accent hover:text-accent-foreground
          flex w-full cursor-pointer items-center justify-between rounded-md
          px-2 py-1.5 text-[13px] font-medium select-none'
      >
        <span className='flex items-center gap-2'>
          <LayersIcon className='text-muted-foreground size-3.5 shrink-0' />
          Components
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
        <div className='flex flex-col gap-0.5 pt-1'>
          {PALETTE_TYPES.map((type) => (
            <PagePaletteItem key={type} type={type} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
