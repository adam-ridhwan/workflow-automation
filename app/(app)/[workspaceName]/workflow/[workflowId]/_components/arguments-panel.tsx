'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CopyIcon, SlidersHorizontalIcon, Trash2Icon } from 'lucide-react';

import { getNodeSpec } from '../_lib/get-node-spec';
import { useCanvasStore } from '../_store/canvas-store';
import { useWorkflowId } from '../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../_hooks/use-workspace-name';

import type { NodeArgument } from '../_types';
import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

/** "max_tokens" -> "Max tokens" */
function formatLabel(name: string) {
  const spaced = name.replaceAll('_', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function ArgumentField({
  node,
  argument,
}: {
  node: Node<WorkflowNodeData>;
  argument: NodeArgument;
}) {
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

function PanelBody({ selectedNode }: { selectedNode: Node<WorkflowNodeData> }) {
  let spec = null;
  try {
    spec = getNodeSpec(selectedNode.data.node_uid);
  } catch {
    spec = null;
  }
  const visibleArguments =
    spec?.node_arguments.filter(
      (argument) => !argument.is_hidden && !argument.is_deprecated
    ) ?? [];

  return (
    <>
      <div
        className='text-muted-foreground px-2 pt-1.5 pb-1 text-[10.5px]
          font-medium tracking-wider uppercase'
      >
        {selectedNode.data.name}
      </div>
      {visibleArguments.length === 0 ? (
        <div className='text-muted-foreground px-2 pb-1.5 text-[13px]'>
          No arguments
        </div>
      ) : (
        visibleArguments.map((argument) => (
          <ArgumentField
            key={argument.name}
            node={selectedNode}
            argument={argument}
          />
        ))
      )}
    </>
  );
}

function PanelFooter({
  selectedNode,
}: {
  selectedNode: Node<WorkflowNodeData>;
}) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const cloneNode = useCanvasStore((s) => s.cloneNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  return (
    <div className='flex items-center gap-1'>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          cloneNode({ workspaceName, workflowId }, selectedNode.id);
        }}
        className='hover:bg-accent hover:text-accent-foreground flex-1 gap-2
          rounded-md text-[13px]'
      >
        <CopyIcon className='text-muted-foreground size-3.5' />
        Clone
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          deleteNode({ workspaceName, workflowId }, selectedNode.id);
        }}
        className='hover:bg-accent hover:text-accent-foreground flex-1 gap-2
          rounded-md text-[13px]'
      >
        <Trash2Icon className='text-muted-foreground size-3.5' />
        Delete
      </Button>
    </div>
  );
}

/** Floating panel in the top-right corner of the canvas; edits the selected
 * node's arguments. Hidden while no node is selected. */
export function ArgumentsPanel() {
  const selectedNode = useCanvasStore((s) =>
    s.nodes.find((node) => node.selected)
  );

  if (!selectedNode) {
    return null;
  }

  return (
    <div
      className='menu-inverted bg-popover text-popover-foreground
        ring-foreground/10 absolute top-4 right-4 z-10 flex w-64 flex-col
        rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl'
    >
      <div
        className='flex w-full items-center gap-2 px-2 py-1.5 text-[13px]
          font-medium select-none'
      >
        <SlidersHorizontalIcon
          className='text-muted-foreground size-3.5 shrink-0'
        />
        Arguments
      </div>

      <PanelBody selectedNode={selectedNode} />

      <Separator className='-mx-1 my-1 w-auto' />

      <PanelFooter selectedNode={selectedNode} />
    </div>
  );
}
