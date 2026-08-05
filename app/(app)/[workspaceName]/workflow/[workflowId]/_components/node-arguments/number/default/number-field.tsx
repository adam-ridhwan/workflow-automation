'use client';

import { Input } from '@/components/ui/input';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkflowId } from '../../../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../../../_hooks/use-workspace-name';

import type { NodeArgument } from '../../../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';

type NumberFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

export function NumberField({
  fieldId,
  nodeId,
  data,
  argument,
}: NumberFieldProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  return (
    <Input
      id={fieldId}
      type='number'
      value={stringValue}
      onChange={(event) => {
        setNodeArgument(nodeId, argument.name, event.target.value);
      }}
      onBlur={(event) => {
        const parsed = Number(event.target.value);
        if (event.target.value !== '' && !Number.isNaN(parsed)) {
          setNodeArgument(nodeId, argument.name, parsed);
        }
        saveWorkflow({ workspaceName, workflowId });
      }}
      className='h-7 rounded-md text-[13px]'
    />
  );
}
