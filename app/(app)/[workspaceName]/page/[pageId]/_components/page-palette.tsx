'use client';

import { PALETTE_TYPES } from '../_constants/page-component-meta';
import { PagePaletteItem } from './page-palette-item';

export function PagePalette() {
  return (
    <aside
      data-page-palette
      className='flex w-52 shrink-0 flex-col gap-3 border-r p-3'
    >
      <div
        className='text-muted-foreground text-xs font-medium tracking-wide
          uppercase'
      >
        Components
      </div>
      <div className='flex flex-col gap-2'>
        {PALETTE_TYPES.map((type) => (
          <PagePaletteItem key={type} type={type} />
        ))}
      </div>
      <p className='text-muted-foreground mt-2 text-[11px] leading-relaxed'>
        Drag a component onto the canvas. Select it to edit its label and bind it
        to a workflow node.
      </p>
    </aside>
  );
}
