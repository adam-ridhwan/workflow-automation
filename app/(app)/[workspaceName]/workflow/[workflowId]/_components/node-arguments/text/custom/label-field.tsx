'use client';

import { Input } from '@/components/ui/input';
import { findNodeSpec, getArgumentValue } from '@/lib/node-specs';

import { useArgumentField } from '../../../../_hooks/use-argument-field';
import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

type LabelFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

/** The TEXT_INPUT `label` argument: a name an LLM prompt can target as
 * `{{label}}`. Flags inline when the label collides with another text input's,
 * so duplicates are caught before the run-button validation does. */
export function LabelField({ fieldId, nodeId, data, argument }: LabelFieldProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const nodes = useCanvasStore((s) => s.nodes);
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

  const trimmed = field.value.trim();
  const isDuplicate =
    trimmed !== '' &&
    nodes.some(
      (node) =>
        node.id !== nodeId &&
        findNodeSpec(node.data.node_uid)?.node_info.node_type ===
          'TEXT_INPUT' &&
        String(getArgumentValue(node.data, 'label') ?? '').trim() === trimmed
    );

  return (
    <>
      <Input
        id={fieldId}
        type='text'
        placeholder='e.g. resume_text'
        disabled={isRunning || readOnly}
        aria-invalid={isDuplicate}
        value={field.value}
        onChange={(e) => {
          field.onChange(e.target.value);
        }}
        onFocus={field.onFocus}
        onBlur={() => {
          field.onBlur();
          saveWorkflow({ workspaceName, workflowId });
        }}
        className='h-7 rounded-md text-[13px]'
      />
      {isDuplicate && (
        <p className='text-destructive text-[11px]'>
          Label must be unique across text inputs.
        </p>
      )}
    </>
  );
}
