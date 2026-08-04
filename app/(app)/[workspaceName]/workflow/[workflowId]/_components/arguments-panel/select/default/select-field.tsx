'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkflowId } from '../../../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../../../_hooks/use-workspace-name';

import type { NodeArgument } from '../../../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type SelectFieldProps = {
  fieldId: string;
  node: Node<WorkflowNodeData>;
  argument: NodeArgument;
};

export function SelectField({ fieldId, node, argument }: SelectFieldProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = node.data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  return (
    <Select
      value={stringValue}
      onValueChange={(next) => {
        setNodeArgument(node.id, argument.name, next);
        saveWorkflow({ workspaceName, workflowId });
      }}
    >
      <SelectTrigger id={fieldId} size='sm' className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(argument.options ?? []).map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
