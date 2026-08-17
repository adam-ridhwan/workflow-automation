'use client';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { StickyNoteIcon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { useCanvasMode } from './canvas-mode-context';
import { WorkflowCanvasNodeAnnotationBar } from './workflow-canvas-node-annotation-bar';

import type { WorkflowAnnotation, WorkflowNodeData } from '@/convex/canvas';

const SIZE_CLASSES: Record<WorkflowAnnotation['size'], string> = {
  sm: 'text-xs md:text-xs',
  md: 'text-sm md:text-sm',
  lg: 'text-base md:text-base',
};

const ALIGN_CLASSES: Record<WorkflowAnnotation['align'], string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

type WorkflowCanvasNodeAnnotationProps = {
  nodeId: string;
  data: WorkflowNodeData;
};

/** Editable note floating above the node. Hidden until the toolbar's note
 * button creates one; clearing the text removes it again. Focusing it
 * reveals a formatting bar for font size and style. */
export function WorkflowCanvasNodeAnnotation({
  nodeId,
  data,
}: WorkflowCanvasNodeAnnotationProps) {
  const { workspaceId, workflowId } = useWorkspaceParams();
  const setNodeAnnotation = useCanvasStore((s) => s.setNodeAnnotation);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const { readOnly } = useCanvasMode();

  const annotation = data.annotation;
  if (annotation === undefined) {
    return null;
  }

  return (
    <div
      data-annotation
      className='nodrag group/annotation absolute right-0 bottom-full left-0
        z-10 mb-2 flex flex-col'
    >
      {!readOnly && (
        <WorkflowCanvasNodeAnnotationBar nodeId={nodeId} data={data} />
      )}

      <div className='relative'>
        <StickyNoteIcon
          className='text-muted-foreground pointer-events-none absolute top-2
            left-2.5 z-10 size-3.5'
        />
        <Textarea
          value={annotation.text}
          placeholder='Add a note…'
          autoFocus={annotation.text === ''}
          disabled={isRunning}
          readOnly={readOnly}
          onChange={(e) => {
            setNodeAnnotation(nodeId, {
              ...annotation,
              text: e.target.value,
            });
          }}
          onBlur={(e) => {
            // Keep the note while focus moves into the formatting bar.
            const wrapper = e.currentTarget.closest('.group\\/annotation');
            const staysInside =
              e.relatedTarget instanceof Node &&
              wrapper?.contains(e.relatedTarget);
            if (e.target.value.trim() === '' && !staysInside) {
              setNodeAnnotation(nodeId, undefined);
            }
            saveWorkflow({ workspaceId, workflowId });
          }}
          className={cn(
            `nowheel bg-card text-muted-foreground ring-foreground/10
            focus-visible:ring-primary dark:bg-card max-h-32 min-h-0 resize-none
            rounded-md border-0 py-1.5 pl-8 ring-1 focus-visible:ring-1`,
            SIZE_CLASSES[annotation.size],
            ALIGN_CLASSES[annotation.align],
            annotation.bold && 'font-semibold',
            annotation.italic && 'italic'
          )}
        />
      </div>
    </div>
  );
}
