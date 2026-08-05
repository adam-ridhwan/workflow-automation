import { findNodeSpec } from './get-node-spec';

import type { WorkflowNodeData } from '@/convex/canvas';

/** A node's stored argument value, falling back to the spec default. */
export function getArgumentValue(data: WorkflowNodeData, name: string) {
  const fromNode = data.arguments[name];
  if (fromNode !== undefined && fromNode !== null && fromNode !== '') {
    return fromNode;
  }
  return findNodeSpec(data.node_uid)?.node_arguments.find(
    (argument) => argument.name === name
  )?.default_value;
}
