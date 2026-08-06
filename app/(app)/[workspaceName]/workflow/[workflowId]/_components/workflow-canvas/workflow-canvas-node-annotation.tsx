'use client';

import { Textarea } from '@/components/ui/textarea';
import { StickyNoteIcon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

import type { WorkflowNodeData } from '@/convex/canvas';

type WorkflowCanvasNodeAnnotationProps = {
  nodeId: string;
  data: WorkflowNodeData;
};

/** Editable note floating above the node. Hidden until the toolbar's note
 * button creates one; clearing the text removes it again. */
export function WorkflowCanvasNodeAnnotation({
  nodeId,
  data,
}: WorkflowCanvasNodeAnnotationProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeAnnotation = useCanvasStore((s) => s.setNodeAnnotation);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);
  const isRunning = useCanvasStore((s) => s.isRunning);

  if (data.annotation === undefined) {
    return null;
  }

  return (
    <div className='nodrag absolute right-0 bottom-full left-0 z-10 mb-2'>
      <StickyNoteIcon
        className='text-muted-foreground pointer-events-none absolute top-2
          left-2.5 z-10 size-3.5'
      />
      <Textarea
        value={data.annotation}
        placeholder='Add a note…'
        autoFocus={data.annotation === ''}
        disabled={isRunning}
        onChange={(event) => {
          setNodeAnnotation(nodeId, event.target.value);
        }}
        onBlur={(event) => {
          if (event.target.value.trim() === '') {
            setNodeAnnotation(nodeId, undefined);
          }
          saveWorkflow({ workspaceName, workflowId });
        }}
        className='nowheel bg-card text-muted-foreground ring-foreground/10
          focus-visible:ring-primary dark:bg-card max-h-32 min-h-0 resize-none
          rounded-md border-0 py-1.5 pl-8 text-xs ring-1 focus-visible:ring-1
          md:text-xs'
      />
    </div>
  );
}
