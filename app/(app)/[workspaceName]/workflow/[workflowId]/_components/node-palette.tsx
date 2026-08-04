'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDraggable } from '@dnd-kit/core';
import {
  BinaryIcon,
  ChevronDownIcon,
  FileTextIcon,
  LayersIcon,
  MonitorIcon,
  SaveIcon,
  SparklesIcon,
  TagsIcon,
  TerminalIcon,
  TextCursorInputIcon,
  WebhookIcon,
} from 'lucide-react';

import { NODE_SPECS } from '../_constants/node-specs';

import type { LucideIcon } from 'lucide-react';

const GROUP_LABELS: Record<string, string> = {
  INPUT: 'Input',
  MODEL: 'Model',
  OUTPUT: 'Output',
};

/** Payload carried by a palette drag. */
export type PaletteDragData = {
  uid: string;
  label: string;
};

/** Display name + icon per node_uid. */
export const NODE_META: Record<string, { label: string; icon: LucideIcon }> = {
  N_001: { label: 'Text input', icon: TextCursorInputIcon },
  N_002: { label: 'File input', icon: FileTextIcon },
  N_003: { label: 'Webhook', icon: WebhookIcon },
  N_005: { label: 'LLM', icon: SparklesIcon },
  N_006: { label: 'Embedding', icon: BinaryIcon },
  N_007: { label: 'Classifier', icon: TagsIcon },
  N_008: { label: 'Display', icon: MonitorIcon },
  N_009: { label: 'Log', icon: TerminalIcon },
  N_010: { label: 'Save dataset', icon: SaveIcon },
};

function PaletteItem({ uid }: { uid: string }) {
  const meta = NODE_META[uid];
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `palette-${uid}`,
    data: { uid, label: meta?.label ?? uid } satisfies PaletteDragData,
  });

  if (!meta) {
    return null;
  }
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      data-dragging={isDragging ? '' : undefined}
      className='hover:bg-accent hover:text-accent-foreground flex cursor-grab
        items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium
        select-none active:cursor-grabbing data-dragging:opacity-50'
    >
      <Icon className='text-muted-foreground size-3.5 shrink-0' />
      {meta.label}
    </div>
  );
}

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
              <PaletteItem
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
