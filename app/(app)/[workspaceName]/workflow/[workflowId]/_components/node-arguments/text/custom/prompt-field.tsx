'use client';

import { InputWithChips } from '@/components/ui/input-with-chips';
import { findNodeSpec, getArgumentValue } from '@/lib/node-specs';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

import type { ChipOption } from '@/components/ui/input-with-chips';
import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';
import type { Node as FlowNode } from '@xyflow/react';

type PromptFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

/**
 * The LLM `prompt` argument: an InputWithChips wired to the node argument. Its
 * "insert" options are the text-input nodes wired into this LLM, so their
 * `{{label}}` tokens can be dropped into the prompt as chips.
 */
export function PromptField({
  fieldId,
  nodeId,
  data,
  argument,
}: PromptFieldProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const { readOnly } = useCanvasMode();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const value = data.arguments[argument.name] ?? argument.default_value;
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  // Text inputs directly wired into this LLM — the sources a chip can pull from.
  const options: ChipOption[] = edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => nodes.find((node) => node.id === edge.source))
    .filter((node): node is FlowNode<WorkflowNodeData> => node !== undefined)
    .filter(
      (node) =>
        findNodeSpec(node.data.node_uid)?.node_info.node_type === 'TEXT_INPUT'
    )
    .map((node) => ({
      id: node.id,
      label: String(getArgumentValue(node.data, 'label') ?? '').trim(),
      hint: `${node.data.name} — set a label`,
    }));

  return (
    <InputWithChips
      id={fieldId}
      aria-labelledby={`${fieldId}-label`}
      className='nowheel'
      value={stringValue}
      disabled={isRunning || readOnly}
      options={options}
      menuHeading='Insert input'
      onChange={(next) => {
        setNodeArgument(nodeId, argument.name, next);
      }}
      onBlur={() => {
        saveWorkflow({ workspaceName, workflowId });
      }}
    />
  );
}
