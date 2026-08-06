import { convex } from '@/components/convev-client-provider';
import { api } from '@/convex/_generated/api';

import { getArgumentValue } from './get-argument-value';
import { findNodeSpec } from './get-node-spec';

import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { Edge, Node } from '@xyflow/react';

/**
 * Runs the canvas graph in topological order. Input nodes produce their
 * configured value, LLM nodes call Claude with `{{input}}` replaced by their
 * parents' output, and every other node passes its input through — which is
 * what output nodes display. Reports each node's output as it lands.
 */
export async function runWorkflow(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[],
  onNodeOutput: (nodeId: string, output: string) => void
) {
  const parents = new Map<string, string[]>(nodes.map((node) => [node.id, []]));
  const children = new Map<string, string[]>(
    nodes.map((node) => [node.id, []])
  );
  const indegree = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    parents.get(edge.target)?.push(edge.source);
    children.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  // Kahn's algorithm; nodes on a cycle never reach the queue and are skipped.
  const queue = nodes.filter((node) => indegree.get(node.id) === 0);
  const order: Node<WorkflowNodeData>[] = [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      break;
    }
    order.push(node);
    for (const childId of children.get(node.id) ?? []) {
      const remaining = (indegree.get(childId) ?? 0) - 1;
      indegree.set(childId, remaining);
      const child = byId.get(childId);
      if (remaining === 0 && child) {
        queue.push(child);
      }
    }
  }

  const outputs: Record<string, string> = {};
  for (const node of order) {
    const input = (parents.get(node.id) ?? [])
      .map((parentId) => outputs[parentId])
      .filter((output) => output !== undefined && output !== '')
      .join('\n');

    let output = input;
    const spec = findNodeSpec(node.data.node_uid);
    switch (spec?.node_info.node_type) {
      case 'TEXT_INPUT':
        output = String(getArgumentValue(node.data, 'value') ?? '');
        break;
      case 'FILE_INPUT':
        output = String(getArgumentValue(node.data, 'content') ?? '');
        break;
      case 'WEBHOOK':
        output = String(getArgumentValue(node.data, 'payload') ?? '');
        break;
      case 'LLM': {
        const provider = String(
          getArgumentValue(node.data, 'provider') ?? 'anthropic'
        );
        if (provider !== 'anthropic') {
          throw new Error(
            `Provider "${provider}" is not wired up yet — use anthropic.`
          );
        }
        const template = String(getArgumentValue(node.data, 'prompt') ?? '');
        output = await convex.action(api.ai.runLlm, {
          model: String(
            getArgumentValue(node.data, 'model') ?? 'claude-sonnet-5'
          ),
          prompt: template.replaceAll('{{value}}', input),
          system:
            String(getArgumentValue(node.data, 'system') ?? '') || undefined,
          maxTokens: Number(getArgumentValue(node.data, 'max_tokens')) || 1024,
        });
        break;
      }
      default:
        // Output nodes (and unknown nodes) pass their input through.
        break;
    }

    outputs[node.id] = output;
    onNodeOutput(node.id, output);
  }
}
