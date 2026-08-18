import { findNodeSpec, getArgumentValue } from '@/lib/node-specs';

import type { WorkflowCanvasData, WorkflowNodeData } from '@/convex/canvas';

export type NodeOption = { nodeId: string; label: string };

const TYPE_LABELS: Record<string, string> = {
  TEXT_INPUT: 'Text input',
  FILE_INPUT: 'File input',
  WEBHOOK: 'Webhook',
  LLM: 'LLM',
  DISPLAY: 'Display',
  LOG: 'Log',
  CREATE_FILE: 'File output',
};

/** A short, human-friendly name for a workflow node, preferring an author-set
 * TEXT_INPUT label, then the node's own name, then its type. */
function friendlyLabel(node: WorkflowNodeData, type: string | undefined): string {
  if (type === 'TEXT_INPUT') {
    const label = String(getArgumentValue(node, 'label') ?? '').trim();
    if (label) {
      return label;
    }
  }
  if (node.name.trim()) {
    return node.name.trim();
  }
  return (type && TYPE_LABELS[type]) ?? 'Node';
}

/** Splits a workflow's canvas into the nodes a page can bind inputs to (its
 * input nodes) and the nodes whose produced text a page can display (model +
 * output nodes). */
export function bindableNodes(canvas: WorkflowCanvasData): {
  inputs: NodeOption[];
  outputs: NodeOption[];
} {
  const inputs: NodeOption[] = [];
  const outputs: NodeOption[] = [];
  for (const node of Object.values(canvas.nodes)) {
    const spec = findNodeSpec(node.node_uid);
    const type = spec?.node_info.node_type;
    const group = spec?.node_info.node_group;
    const option: NodeOption = {
      nodeId: node.node_id,
      label: friendlyLabel(node, type),
    };
    if (type === 'TEXT_INPUT' || type === 'FILE_INPUT') {
      inputs.push(option);
    }
    if (group === 'MODEL' || group === 'OUTPUT') {
      outputs.push(option);
    }
  }
  return { inputs, outputs };
}
