'use client';

import { Input } from '@/components/ui/input';

import { useArgumentField } from '../../../../_hooks/use-argument-field';
import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

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
  const { workspaceName, workflowId } = useWorkspaceParams();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
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
    <Input
      id={fieldId}
      type='number'
      disabled={isRunning || readOnly}
      value={field.value}
      onChange={(e) => {
        field.onChange(e.target.value);
      }}
      onFocus={field.onFocus}
      onBlur={(e) => {
        field.onBlur();
        const parsed = Number(e.target.value);
        if (e.target.value !== '' && !Number.isNaN(parsed)) {
          setNodeArgument(nodeId, argument.name, parsed);
        }
        saveWorkflow({ workspaceName, workflowId });
      }}
      className='h-7 rounded-md text-[13px]'
    />
  );
}
