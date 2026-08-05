'use client';

import { Textarea } from '@/components/ui/textarea';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkflowId } from '../../../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../../../_hooks/use-workspace-name';

import type { NodeArgument } from '../../../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';

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
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  return (
    <Textarea
      id={fieldId}
      value={stringValue}
      onChange={(event) => {
        setNodeArgument(nodeId, argument.name, event.target.value);
      }}
      onBlur={() => {
        saveWorkflow({ workspaceName, workflowId });
      }}
      className='nowheel max-h-48 min-h-20 rounded-md py-1.5 font-mono
        text-[13px] md:text-[13px]'
    />
  );
}
