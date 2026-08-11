'use client';

import { Textarea } from '@/components/ui/textarea';

import { useArgumentField } from '../../../../_hooks/use-argument-field';
import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

type PromptFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

/** Multiline editor for the LLM `prompt` argument. */
export function PromptField({
  fieldId,
  nodeId,
  data,
  argument,
}: PromptFieldProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const { readOnly } = useCanvasMode();
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);
  const field = useArgumentField({
    nodeId,
    name: argument.name,
    externalValue: stringValue,
  });

  return (
    <Textarea
      id={fieldId}
      disabled={isRunning || readOnly}
      value={field.value}
      onChange={(event) => {
        field.onChange(event.target.value);
      }}
      onFocus={field.onFocus}
      onBlur={() => {
        field.onBlur();
        saveWorkflow({ workspaceName, workflowId });
      }}
      className='nowheel max-h-48 min-h-20 rounded-md py-1.5 font-mono
        text-[13px] md:text-[13px]'
    />
  );
}
