import {
  HeadingIcon,
  MousePointerClickIcon,
  TextIcon,
  TypeIcon,
  UploadIcon,
} from 'lucide-react';

import type { PageComponentType } from '@/convex/pageLayout';
import type { LucideIcon } from 'lucide-react';

export type PageComponentMeta = {
  label: string;
  icon: LucideIcon;
  /** Whether this component binds to a workflow node (inputs + output). */
  binds: 'input' | 'output' | null;
  defaultSize: { w: number; h: number };
  defaultProps: Record<string, unknown>;
};

/** The kinds a user can drop from the palette, in palette order. */
export const PALETTE_TYPES: PageComponentType[] = [
  'HEADING',
  'TEXT',
  'TEXT_INPUT',
  'FILE_INPUT',
  'BUTTON',
  'OUTPUT',
];

export const PAGE_COMPONENT_META: Record<PageComponentType, PageComponentMeta> =
  {
    HEADING: {
      label: 'Heading',
      icon: HeadingIcon,
      binds: null,
      defaultSize: { w: 320, h: 44 },
      defaultProps: { text: 'Heading' },
    },
    TEXT: {
      label: 'Text',
      icon: TextIcon,
      binds: null,
      defaultSize: { w: 320, h: 60 },
      defaultProps: { text: 'Some descriptive text.' },
    },
    TEXT_INPUT: {
      label: 'Text input',
      icon: TypeIcon,
      binds: 'input',
      defaultSize: { w: 320, h: 92 },
      defaultProps: {
        label: 'Input',
        placeholder: 'Type here…',
        multiline: true,
      },
    },
    FILE_INPUT: {
      label: 'File input',
      icon: UploadIcon,
      binds: 'input',
      defaultSize: { w: 320, h: 92 },
      defaultProps: { label: 'File' },
    },
    BUTTON: {
      label: 'Run button',
      icon: MousePointerClickIcon,
      binds: null,
      defaultSize: { w: 160, h: 44 },
      defaultProps: { text: 'Run' },
    },
    OUTPUT: {
      label: 'Output',
      icon: TextIcon,
      binds: 'output',
      defaultSize: { w: 420, h: 200 },
      defaultProps: { label: 'Output' },
    },
  };

export const GRID_SIZE = 8;
export const MIN_COMPONENT_W = 96;
export const MIN_COMPONENT_H = 40;

/** Snap a coordinate to the builder grid. */
export function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
