'use node';

import Anthropic from '@anthropic-ai/sdk';
import { ConvexError, v } from 'convex/values';

import { findNodeSpec, getArgumentValue } from '../lib/node-specs';
import { api, internal } from './_generated/api';
import { action, internalAction } from './_generated/server';
import { workflowCanvasValidator } from './canvas';

import type { Id } from './_generated/dataModel';
import type { WorkflowCanvasData, WorkflowNodeData } from './canvas';

/** Returns a copy of the canvas with every node id replaced by a fresh one
 * (edges, parents, and children remapped to match), plus the old→new id map. */
function remapCanvasIds(canvas: WorkflowCanvasData): {
  canvas: WorkflowCanvasData;
  idMap: Record<string, string>;
} {
  const idMap: Record<string, string> = {};
  for (const node of Object.values(canvas.nodes)) {
    idMap[node.node_id] = crypto.randomUUID();
  }
  const remap = (id: string) => idMap[id] ?? id;

  const nodes: Record<string, WorkflowNodeData> = {};
  for (const node of Object.values(canvas.nodes)) {
    const newId = remap(node.node_id);
    nodes[newId] = {
      ...node,
      node_id: newId,
      parents: node.parents.map(remap),
      children: node.children.map(remap),
    };
  }
  const edges = canvas.edges.map((edge) => ({
    ...edge,
    source: remap(edge.source),
    target: remap(edge.target),
  }));

  return { canvas: { ...canvas, nodes, edges }, idMap };
}

/** Re-keys node outputs from the original ids to the snapshot's fresh ids. */
function remapOutputs(
  outputs: Record<string, string>,
  idMap: Record<string, string>
): Record<string, string> {
  const remapped: Record<string, string> = {};
  for (const [nodeId, output] of Object.entries(outputs)) {
    remapped[idMap[nodeId] ?? nodeId] = output;
  }
  return remapped;
}

/**
 * Runs a canvas whose history record already exists, in the background. Used
 * by `runHistory.startRerun` so the client can navigate to the new run
 * immediately while it executes. No live-run badges — the run-history view
 * reads the history record, which is reactive.
 */
export const execute = internalAction({
  args: {
    workflowId: v.id('workflows'),
    runHistoryId: v.id('runHistory'),
    canvas: workflowCanvasValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const setNodeStatus = async (
      nodeId: string,
      status: 'running' | 'success' | 'error'
    ) => {
      await ctx.runMutation(internal.runHistory.setNodeStatus, {
        runHistoryId: args.runHistoryId,
        nodeId,
        status,
      });
      return null;
    };

    const checkStop = () =>
      ctx.runQuery(internal.runHistory.isStopRequested, {
        runHistoryId: args.runHistoryId,
      });

    try {
      const outputs = await executeCanvas(
        args.canvas,
        setNodeStatus,
        checkStop
      );
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        success: true,
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId: args.runHistoryId,
        status: 'success',
        nodeOutputs: outputs,
      });
    } catch (error) {
      const stopped = error instanceof StopError;
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        success: false,
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId: args.runHistoryId,
        status: stopped ? 'stopped' : 'error',
        nodeOutputs: {},
        error: stopped
          ? undefined
          : error instanceof Error
            ? error.message
            : 'The run failed.',
      });
    }
    return null;
  },
});

export const run = action({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.id('runHistory'),
  handler: async (ctx, args): Promise<Id<'runHistory'>> => {
    const workflow = await ctx.runQuery(api.workflows.get, {
      workspaceName: args.workspaceName,
      workflowId: args.workflowId,
    });
    if (workflow === null) {
      throw new ConvexError('Workflow not found.');
    }

    await ctx.runMutation(internal.runs.start, {
      workflowId: args.workflowId,
    });
    // The history snapshot gets fresh node ids so its data can never collide
    // with the live editing canvas (whose badges are keyed by the original
    // ids). Execution runs on the original canvas; outputs are remapped.
    const { canvas: snapshotCanvas, idMap } = remapCanvasIds(workflow.canvas);
    const runHistoryId = await ctx.runMutation(internal.runHistory.create, {
      workflowId: args.workflowId,
      canvas: snapshotCanvas,
    });
    const setNodeStatus = async (
      nodeId: string,
      status: 'running' | 'success' | 'error',
      output?: string
    ) => {
      // Live editing-canvas badges (original ids) + the history record
      // (remapped ids).
      await ctx.runMutation(internal.runs.setNodeStatus, {
        workflowId: args.workflowId,
        nodeId,
        status,
        output,
      });
      await ctx.runMutation(internal.runHistory.setNodeStatus, {
        runHistoryId,
        nodeId: idMap[nodeId] ?? nodeId,
        status,
      });
      return null;
    };

    const checkStop = () =>
      ctx.runQuery(internal.runHistory.isStopRequested, { runHistoryId });

    try {
      const outputs = await executeCanvas(
        workflow.canvas,
        setNodeStatus,
        checkStop
      );
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        success: true,
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId,
        status: 'success',
        nodeOutputs: remapOutputs(outputs, idMap),
      });
      await ctx.scheduler.runAfter(1000, internal.runs.clearStatuses, {
        workflowId: args.workflowId,
      });
      return runHistoryId;
    } catch (error) {
      const stopped = error instanceof StopError;
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        success: false,
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId,
        status: stopped ? 'stopped' : 'error',
        nodeOutputs: {},
        error: stopped
          ? undefined
          : error instanceof Error
            ? error.message
            : 'The run failed.',
      });
      await ctx.scheduler.runAfter(1000, internal.runs.clearStatuses, {
        workflowId: args.workflowId,
      });
      // A user-requested stop isn't an error — return normally so the client
      // doesn't show a failure toast.
      if (stopped) {
        return runHistoryId;
      }
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
/** Thrown by the executor when a stop was requested mid-run. */
class StopError extends Error {}

async function executeCanvas(
  canvas: WorkflowCanvasData,
  setNodeStatus: (
    nodeId: string,
    status: 'running' | 'success' | 'error',
    output?: string
  ) => Promise<null>,
  checkStop: () => Promise<boolean>
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
    if (await checkStop()) {
      throw new StopError();
    }

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
          output = String(getArgumentValue(node, 'text_input') ?? '');
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
      { role: 'user', content: template.replaceAll('{{text_input}}', input) },
    ],
  });

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
