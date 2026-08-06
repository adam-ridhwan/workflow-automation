import { findNodeSpec } from './get-node-spec';

import type { WorkflowNodeData } from '@/convex/canvas';

/** A node's stored argument value, falling back to the spec default when the
 * node has never set one. A stored empty string counts as a value — matching
 * what the argument fields display — so clearing a field doesn't silently
 * revert to the default. */
export function getArgumentValue(data: WorkflowNodeData, name: string) {
  return (
    data.arguments[name] ??
    findNodeSpec(data.node_uid)?.node_arguments.find(
      (argument) => argument.name === name
    )?.default_value
  );
}
