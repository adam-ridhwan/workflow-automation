'use client';

import { findNodeSpec } from '../../_lib/get-node-spec';
import { NodeArgumentsField } from './node-arguments-field';

import type { WorkflowNodeData } from '@/convex/canvas';

type NodeArgumentsProps = {
  nodeId: string;
  data: WorkflowNodeData;
};

/** The editable argument fields rendered inside a canvas node. */
export function NodeArguments({ nodeId, data }: NodeArgumentsProps) {
  const spec = findNodeSpec(data.node_uid);
  const visibleArguments =
    spec?.node_arguments.filter(
      (argument) => !argument.is_hidden && !argument.is_deprecated
    ) ?? [];

  if (visibleArguments.length === 0) {
    return null;
  }

  return (
    <div
      className='nodrag border-border flex cursor-default flex-col border-t
        pb-1'
    >
      {visibleArguments.map((argument) => (
        <NodeArgumentsField
          key={argument.name}
          nodeId={nodeId}
          data={data}
          argument={argument}
        />
      ))}
    </div>
  );
}
