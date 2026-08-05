'use client';

import { Input } from '@/components/ui/input';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkflowId } from '../../../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../../../_hooks/use-workspace-name';
import { PromptField } from '../custom/prompt-field';

import type { NodeArgument } from '../../../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';

type TextFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

export function TextField({ fieldId, nodeId, data, argument }: TextFieldProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
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
