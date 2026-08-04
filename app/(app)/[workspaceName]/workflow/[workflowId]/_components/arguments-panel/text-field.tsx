'use client';

import { Input } from '@/components/ui/input';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

import type { NodeArgument } from '../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type TextFieldProps = {
  fieldId: string;
  node: Node<WorkflowNodeData>;
  argument: NodeArgument;
};

export function TextField({ fieldId, node, argument }: TextFieldProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = node.data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  return (
    <Input
      id={fieldId}
      type='text'
      value={stringValue}
      onChange={(event) => {
        setNodeArgument(node.id, argument.name, event.target.value);
      }}
      onBlur={() => {
        saveWorkflow({ workspaceName, workflowId });
      }}
      className='h-7 rounded-md text-[13px]'
    />
  );
}
