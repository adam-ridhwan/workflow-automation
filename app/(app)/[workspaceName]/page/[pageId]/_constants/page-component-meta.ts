import {
  ChevronsUpDownIcon,
  HashIcon,
  HeadingIcon,
  ImageIcon,
  MinusIcon,
  MousePointerClickIcon,
  SquareCheckIcon,
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
  'DIVIDER',
  'IMAGE',
  'TEXT_INPUT',
  'NUMBER_INPUT',
  'SELECT',
  'CHECKBOX',
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
    NUMBER_INPUT: {
      label: 'Number input',
      icon: HashIcon,
      binds: 'input',
      defaultSize: { w: 320, h: 72 },
      defaultProps: { label: 'Number', placeholder: '0' },
    },
    SELECT: {
      label: 'Dropdown',
      icon: ChevronsUpDownIcon,
      binds: 'input',
      defaultSize: { w: 320, h: 72 },
      defaultProps: {
        label: 'Select',
        options: 'Option 1\nOption 2\nOption 3',
      },
    },
    CHECKBOX: {
      label: 'Checkbox',
      icon: SquareCheckIcon,
      binds: 'input',
      defaultSize: { w: 240, h: 44 },
      defaultProps: { label: 'Enabled' },
    },
    DIVIDER: {
      label: 'Divider',
      icon: MinusIcon,
      binds: null,
      defaultSize: { w: 320, h: 24 },
      defaultProps: {},
    },
    IMAGE: {
      label: 'Image',
      icon: ImageIcon,
      binds: null,
      defaultSize: { w: 320, h: 180 },
      defaultProps: { url: '', alt: '' },
    },
    BUTTON: {
      label: 'Button',
      icon: MousePointerClickIcon,
      binds: null,
      defaultSize: { w: 160, h: 44 },
      defaultProps: { text: 'Run', action: 'run' },
    },
    OUTPUT: {
      label: 'Output',
      icon: TextIcon,
      binds: 'output',
      defaultSize: { w: 420, h: 200 },
      defaultProps: { label: 'Output' },
    },
  };

/** Whether a component feeds a workflow input at run time. */
export function isInputComponent(type: PageComponentType): boolean {
  return PAGE_COMPONENT_META[type].binds === 'input';
}

/** Inner padding (px) between the container border and where components snap. */
export const CONTAINER_PADDING = 16;

export const GRID_SIZE = 8;
export const MIN_COMPONENT_W = 96;
export const MIN_COMPONENT_H = 40;

/** Snap a coordinate to the builder grid. */
export function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}
