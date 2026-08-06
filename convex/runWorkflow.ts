'use node';

import Anthropic from '@anthropic-ai/sdk';
import { ConvexError, v } from 'convex/values';

import { findNodeSpec, getArgumentValue } from '../lib/node-specs';
import { api, internal } from './_generated/api';
import { action } from './_generated/server';

import type { WorkflowCanvasData, WorkflowNodeData } from './canvas';

export const run = action({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.record(v.string(), v.string()),
  handler: async (ctx, args) => {
    const workflow = await ctx.runQuery(api.workflows.get, args);
    if (workflow === null) {
      throw new ConvexError('Workflow not found.');
    }

    await ctx.runMutation(internal.runs.start, {
      workflowId: args.workflowId,
    });
    const setNodeStatus = (
      nodeId: string,
      status: 'running' | 'success' | 'error',
      output?: string
    ) =>
      ctx.runMutation(internal.runs.setNodeStatus, {
        workflowId: args.workflowId,
        nodeId,
        status,
        output,
      });

    try {
      const outputs = await executeCanvas(workflow.canvas, setNodeStatus);
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        success: true,
      });
      await ctx.scheduler.runAfter(1000, internal.runs.clearStatuses, {
        workflowId: args.workflowId,
      });
      return outputs;
    } catch (error) {
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        success: false,
      });
      throw error;
    }
  },
});

/**
 * Runs the canvas graph in topological order. Input nodes produce their
 * configured value, LLM nodes call Claude with `{{value}}` replaced by their
 * parents' output, and every other node passes its input through — which is
 * what output nodes display. Returns each node's output keyed by node_id.
 */
async function executeCanvas(
  canvas: WorkflowCanvasData,
  setNodeStatus: (
    nodeId: string,
    status: 'running' | 'success' | 'error',
    output?: string
  ) => Promise<null>
) {
  const nodes = Object.values(canvas.nodes);
  const edges = canvas.edges;

  const parents = new Map<string, string[]>(
    nodes.map((node) => [node.node_id, []])
  );
  const children = new Map<string, string[]>(
    nodes.map((node) => [node.node_id, []])
  );
  const indegree = new Map<string, number>(
    nodes.map((node) => [node.node_id, 0])
  );
  for (const edge of edges) {
    parents.get(edge.target)?.push(edge.source);
    children.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  // Kahn's algorithm; nodes on a cycle never reach the queue and are skipped.
  const queue = nodes.filter((node) => indegree.get(node.node_id) === 0);
  const order: WorkflowNodeData[] = [];
  const byId = new Map(nodes.map((node) => [node.node_id, node]));
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      break;
    }
    order.push(node);
    for (const childId of children.get(node.node_id) ?? []) {
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
    const input = (parents.get(node.node_id) ?? [])
      .map((parentId) => outputs[parentId])
      .filter((output) => output !== undefined && output !== '')
      .join('\n');

    await setNodeStatus(node.node_id, 'running');
    let output = input;
    try {
      const spec = findNodeSpec(node.node_uid);
      switch (spec?.node_info.node_type) {
        case 'TEXT_INPUT':
          output = String(getArgumentValue(node, 'value') ?? '');
          break;
        case 'FILE_INPUT':
          output = String(getArgumentValue(node, 'content') ?? '');
          break;
        case 'WEBHOOK':
          output = String(getArgumentValue(node, 'payload') ?? '');
          break;
        case 'LLM':
          output = await runLlmNode(node, input);
          break;
        default:
          // Output nodes (and unknown nodes) pass their input through.
          break;
      }
    } catch (error) {
      await setNodeStatus(node.node_id, 'error');
      throw error;
    }

    outputs[node.node_id] = output;
    await setNodeStatus(node.node_id, 'success', output);
  }
  return outputs;
}

async function runLlmNode(node: WorkflowNodeData, input: string) {
  const provider = String(getArgumentValue(node, 'provider') ?? 'anthropic');
  if (provider !== 'anthropic') {
    throw new ConvexError(
      `Provider "${provider}" is not wired up yet — use anthropic.`
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ConvexError(
      'ANTHROPIC_API_KEY is not set. Run: npx convex env set ANTHROPIC_API_KEY <key>'
    );
  }

  const template = String(getArgumentValue(node, 'prompt') ?? '');
  const system = String(getArgumentValue(node, 'system') ?? '');
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: String(getArgumentValue(node, 'model') ?? 'claude-sonnet-5'),
    max_tokens: Number(getArgumentValue(node, 'max_tokens')) || 1024,
    system: system || undefined,
    messages: [
      { role: 'user', content: template.replaceAll('{{value}}', input) },
    ],
  });

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
