'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

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
  const { workspaceId, workflowId } = useWorkspaceParams();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const { readOnly } = useCanvasMode();
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const boolValue = value === true || value === 'true';

  return (
    <ToggleGroup
      id={fieldId}
      disabled={isRunning || readOnly}
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
        saveWorkflow({ workspaceId, workflowId });
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
