'use client';

import { findNodeSpec } from '../../_lib/get-node-spec';
import { ArgumentsPanelField } from './arguments-panel-field';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type ArgumentsPanelBodyProps = {
  selectedNode: Node<WorkflowNodeData>;
};

export function ArgumentsPanelBody({ selectedNode }: ArgumentsPanelBodyProps) {
  const spec = findNodeSpec(selectedNode.data.node_uid);
  const visibleArguments =
    spec?.node_arguments.filter(
      (argument) => !argument.is_hidden && !argument.is_deprecated
    ) ?? [];

  if (visibleArguments.length === 0) {
    return (
      <div className='text-muted-foreground px-2 pb-1.5 text-[13px]'>
        No arguments
      </div>
    );
  }

  return (
    <>
      {visibleArguments.map((argument) => (
        <ArgumentsPanelField
          key={argument.name}
          node={selectedNode}
          argument={argument}
        />
      ))}
    </>
  );
}
