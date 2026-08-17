'use client';

import { Input } from '@/components/ui/input';

import { useArgumentField } from '../../../../_hooks/use-argument-field';
import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';
import { LabelField } from '../custom/label-field';
import { PromptField } from '../custom/prompt-field';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

type TextFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

export function TextField({ fieldId, nodeId, data, argument }: TextFieldProps) {
  const { workspaceId, workflowId } = useWorkspaceParams();
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

  switch (argument.name) {
    case 'prompt':
      return (
        <PromptField
          fieldId={fieldId}
          nodeId={nodeId}
          data={data}
          argument={argument}
        />
      );

    case 'label':
      return (
        <LabelField
          fieldId={fieldId}
          nodeId={nodeId}
          data={data}
          argument={argument}
        />
      );

    default:
      return (
        <Input
          id={fieldId}
          type='text'
          disabled={isRunning || readOnly}
          value={field.value}
          onChange={(e) => {
            field.onChange(e.target.value);
          }}
          onFocus={field.onFocus}
          onBlur={() => {
            field.onBlur();
            saveWorkflow({ workspaceId, workflowId });
          }}
          className='h-7 rounded-md text-[13px]'
        />
      );
  }
}
