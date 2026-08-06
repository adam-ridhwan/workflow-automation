'use client';

import { Input } from '@/components/ui/input';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';
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
  const { workspaceName, workflowId } = useWorkspaceParams();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const isRunning = useCanvasStore((s) => s.isRunning);
  const { readOnly } = useCanvasMode();
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

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

    default:
      return (
        <Input
          id={fieldId}
          type='text'
          disabled={isRunning || readOnly}
          value={stringValue}
          onChange={(event) => {
            setNodeArgument(nodeId, argument.name, event.target.value);
          }}
          onBlur={() => {
            saveWorkflow({ workspaceName, workflowId });
          }}
          className='h-7 rounded-md text-[13px]'
        />
      );
  }
}
