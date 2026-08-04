import { NODE_SPECS } from '../_constants/node-specs';

import type { NodeSpec } from '../_types';

const specsByUid = new Map<string, NodeSpec>(
  Object.values(NODE_SPECS)
    .flatMap((group) => Object.values(group))
    .map((spec) => [spec.node_info.node_uid, spec])
);

/** Look up a node spec by its `node_uid` (the id stored on canvas nodes). */
export function getNodeSpec(nodeUid: string): NodeSpec {
  const spec = specsByUid.get(nodeUid);
  if (spec === undefined) {
    throw new Error(`Unknown node spec: ${nodeUid}`);
  }
  return spec;
}
