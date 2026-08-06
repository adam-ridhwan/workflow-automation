'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkflowId } from '../../../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../../../_hooks/use-workspace-name';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

type BooleanFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

export function BooleanField({
  fieldId,
  nodeId,
  data,
  argument,
}: BooleanFieldProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const isRunning = useCanvasStore((s) => s.isRunning);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const boolValue = value === true || value === 'true';

  return (
    <ToggleGroup
      id={fieldId}
      disabled={isRunning}
      variant='outline'
      size='sm'
      spacing={0}
      value={[boolValue ? 'true' : 'false']}
      onValueChange={(groupValue) => {
        const next = groupValue[0];
        // Clicking the already-selected item deselects; a boolean is never
        // "neither", so ignore that.
        if (next === undefined) {
          return;
        }
        setNodeArgument(nodeId, argument.name, next === 'true');
        saveWorkflow({ workspaceName, workflowId });
      }}
      className='w-full'
    >
      <ToggleGroupItem value='true' className='h-7 flex-1 text-[13px]'>
        True
      </ToggleGroupItem>
      <ToggleGroupItem value='false' className='h-7 flex-1 text-[13px]'>
        False
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
