'use client';

import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
} from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

import type { WorkflowAnnotation, WorkflowNodeData } from '@/convex/canvas';

export const DEFAULT_ANNOTATION: WorkflowAnnotation = {
  text: '',
  size: 'sm',
  bold: false,
  italic: false,
  align: 'left',
};

type WorkflowCanvasNodeAnnotationBarProps = {
  nodeId: string;
  data: WorkflowNodeData;
};

/** Formatting controls shown above the annotation while it has focus.
 * `onMouseDown` preventDefault keeps the textarea focused while clicking. */
export function WorkflowCanvasNodeAnnotationBar({
  nodeId,
  data,
}: WorkflowCanvasNodeAnnotationBarProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const setNodeAnnotation = useCanvasStore((s) => s.setNodeAnnotation);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const annotation = data.annotation;
  if (annotation === undefined) {
    return null;
  }

  function update(next: WorkflowAnnotation) {
    setNodeAnnotation(nodeId, next);
    saveWorkflow({ workspaceName, workflowId });
  }

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      className='bg-card ring-foreground/10 mb-2 hidden w-full items-center
        justify-between gap-1 rounded-md p-0.5 ring-1
        group-focus-within/annotation:flex'
    >
      <ToggleGroup
        size='sm'
        spacing={0}
        value={[annotation.size]}
        onValueChange={(groupValue) => {
          const size = groupValue[0] as WorkflowAnnotation['size'] | undefined;
          if (size !== undefined) {
            update({ ...annotation, size });
          }
        }}
      >
        <ToggleGroupItem value='sm' aria-label='Small text' className='size-6'>
          S
        </ToggleGroupItem>
        <ToggleGroupItem value='md' aria-label='Medium text' className='size-6'>
          M
        </ToggleGroupItem>
        <ToggleGroupItem value='lg' aria-label='Large text' className='size-6'>
          L
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator
        orientation='vertical'
        className='data-vertical:h-4 data-vertical:self-auto'
      />

      <ToggleGroup
        size='sm'
        spacing={0}
        multiple
        value={[
          ...(annotation.bold ? ['bold'] : []),
          ...(annotation.italic ? ['italic'] : []),
        ]}
        onValueChange={(groupValue) => {
          update({
            ...annotation,
            bold: groupValue.includes('bold'),
            italic: groupValue.includes('italic'),
          });
        }}
      >
        <ToggleGroupItem value='bold' aria-label='Bold' className='size-6'>
          <BoldIcon className='size-3' />
        </ToggleGroupItem>
        <ToggleGroupItem value='italic' aria-label='Italic' className='size-6'>
          <ItalicIcon className='size-3' />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator
        orientation='vertical'
        className='data-vertical:h-4 data-vertical:self-auto'
      />

      <ToggleGroup
        size='sm'
        spacing={0}
        value={[annotation.align]}
        onValueChange={(groupValue) => {
          const align = groupValue[0] as
            WorkflowAnnotation['align'] | undefined;
          if (align !== undefined) {
            update({ ...annotation, align });
          }
        }}
      >
        <ToggleGroupItem
          value='left'
          aria-label='Align left'
          className='size-6'
        >
          <AlignLeftIcon className='size-3' />
        </ToggleGroupItem>
        <ToggleGroupItem
          value='center'
          aria-label='Align center'
          className='size-6'
        >
          <AlignCenterIcon className='size-3' />
        </ToggleGroupItem>
        <ToggleGroupItem
          value='right'
          aria-label='Align right'
          className='size-6'
        >
          <AlignRightIcon className='size-3' />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
