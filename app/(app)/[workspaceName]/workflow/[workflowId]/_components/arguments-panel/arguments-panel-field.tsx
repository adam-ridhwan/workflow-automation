'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

import type { NodeArgument } from '../../_types';
import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

/** "max_tokens" -> "Max tokens" */
function formatLabel(name: string) {
  const spaced = name.replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type ArgumentsPanelFieldProps = {
  node: Node<WorkflowNodeData>;
  argument: NodeArgument;
};

export function ArgumentsPanelField({
  node,
  argument,
}: ArgumentsPanelFieldProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = node.data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  function commit() {
    saveWorkflow({ workspaceName, workflowId });
  }

  return (
    <div className='flex flex-col gap-1 px-2 py-1.5'>
      <Label
        htmlFor={`arg-${node.id}-${argument.name}`}
        className='text-muted-foreground text-xs'
      >
        {formatLabel(argument.name)}
        {argument.is_required && <span className='text-destructive'>*</span>}
      </Label>

      {argument.have_options && argument.options ? (
        <Select
          value={stringValue}
          onValueChange={(next) => {
            setNodeArgument(node.id, argument.name, next);
            commit();
          }}
        >
          <SelectTrigger
            id={`arg-${node.id}-${argument.name}`}
            size='sm'
            className='w-full'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {argument.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={`arg-${node.id}-${argument.name}`}
          type={argument.argument_type === 'NUMBER' ? 'number' : 'text'}
          value={stringValue}
          onChange={(event) => {
            setNodeArgument(node.id, argument.name, event.target.value);
          }}
          onBlur={(event) => {
            if (argument.argument_type === 'NUMBER') {
              const parsed = Number(event.target.value);
              if (event.target.value !== '' && !Number.isNaN(parsed)) {
                setNodeArgument(node.id, argument.name, parsed);
              }
            }
            commit();
          }}
          className='h-7 rounded-md text-[13px]'
        />
      )}
    </div>
  );
}
