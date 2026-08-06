'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useRequiredWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

type SelectFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

export function SelectField({
  fieldId,
  nodeId,
  data,
  argument,
}: SelectFieldProps) {
  const { workspaceName, workflowId } = useRequiredWorkspaceParams();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const isRunning = useCanvasStore((s) => s.isRunning);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  return (
    <Select
      disabled={isRunning}
      value={stringValue}
      onValueChange={(next) => {
        setNodeArgument(nodeId, argument.name, next);
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
