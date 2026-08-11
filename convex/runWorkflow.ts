'use node';

import Anthropic from '@anthropic-ai/sdk';
import { ConvexError, v } from 'convex/values';

import { findNodeSpec, getArgumentValue } from '../lib/node-specs';
import { api, internal } from './_generated/api';
import { action, internalAction } from './_generated/server';
import { workflowCanvasValidator } from './canvas';

import type { Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import type { WorkflowCanvasData, WorkflowNodeData } from './canvas';

// A FILE_INPUT node emits its file's text; cap it so a huge upload can't blow
// up a run's memory or a downstream model's context.
const MAX_FILE_CHARS = 200_000;

/** Builds the reader passed to `executeCanvas` for FILE_INPUT nodes: resolves a
 * selected file id (scoped to the workflow's workspace) to its stored text.
 * Returns '' for a missing/foreign/not-ready file or a malformed id. */
function makeFileReader(
  ctx: ActionCtx,
  workflowId: Id<'workflows'>
): (fileId: string) => Promise<string> {
  return async (fileId) => {
    try {
      const ref = await ctx.runQuery(internal.files.contentForRun, {
        workflowId,
        fileId: fileId as Id<'files'>,
      });
      if (ref === null) {
        return '';
      }
      const blob = await ctx.storage.get(ref.storageId);
      if (blob === null) {
        return '';
      }
      const text = await blob.text();
      return text.length > MAX_FILE_CHARS
        ? text.slice(0, MAX_FILE_CHARS)
        : text;
    } catch {
      return '';
    }
  };
}

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

/** The message stored for a finished run: none when the user stopped it,
 * otherwise the error's message (or a generic fallback). */
function runErrorMessage(stopped: boolean, error: unknown): string | undefined {
  if (stopped) {
    return undefined;
  }
  return error instanceof Error ? error.message : 'The run failed.';
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
    /** Present when triggered by an inbound webhook; feeds WEBHOOK nodes. */
    webhookPayload: v.optional(v.string()),
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
        checkStop,
        makeFileReader(ctx, args.workflowId),
        args.webhookPayload
      );
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        status: 'success',
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
        status: stopped ? 'stopped' : 'error',
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId: args.runHistoryId,
        status: stopped ? 'stopped' : 'error',
        nodeOutputs: {},
        error: runErrorMessage(stopped, error),
      });
    }
    return null;
  },
});

/**
 * Runs one step of a workflow chain to completion. The step lights up its own
 * canvas live (the `runs` doc) exactly like clicking "Run Workflow", and once it
 * finishes the run is written to that workflow's history. Returns the step's
 * final status so the chain runner can surface it. Runs synchronously (via
 * `ctx.runAction`) so the chain executes strictly in order.
 */
export const runChainStep = internalAction({
  args: {
    workflowId: v.id('workflows'),
    canvas: workflowCanvasValidator,
  },
  returns: v.union(v.literal('success'), v.literal('error')),
  handler: async (ctx, args): Promise<'success' | 'error'> => {
    await ctx.runMutation(internal.runs.start, { workflowId: args.workflowId });

    // The history record uses fresh node ids so its data never collides with the
    // workflow's live editing canvas (whose badges are keyed by the original
    // ids). We run on the original canvas and remap outputs for the record.
    const { canvas: snapshotCanvas, idMap } = remapCanvasIds(args.canvas);

    const setNodeStatus = async (
      nodeId: string,
      status: 'running' | 'success' | 'error',
      output?: string
    ) => {
      await ctx.runMutation(internal.runs.setNodeStatus, {
        workflowId: args.workflowId,
        nodeId,
        status,
        output,
      });
      return null;
    };

    // A chain step has no user "stop" affordance — it runs to completion.
    const checkStop = async () => false;

    let status: 'success' | 'error' = 'success';
    let outputs: Record<string, string> = {};
    let error: string | undefined;
    try {
      outputs = await executeCanvas(
        args.canvas,
        setNodeStatus,
        checkStop,
        makeFileReader(ctx, args.workflowId),
        undefined
      );
    } catch (caught) {
      status = 'error';
      error = caught instanceof Error ? caught.message : 'The run failed.';
    }

    await ctx.runMutation(internal.workflows.recordRun, {
      workflowId: args.workflowId,
      status,
    });
    // Write history only after the run finishes, as one completed record.
    await ctx.runMutation(internal.runHistory.record, {
      workflowId: args.workflowId,
      canvas: snapshotCanvas,
      status,
      nodeOutputs: status === 'success' ? remapOutputs(outputs, idMap) : {},
      error,
    });
    // Free the run button now; let the finished badges linger a beat, then fade.
    await ctx.runMutation(internal.runs.markFinished, {
      workflowId: args.workflowId,
    });
    await ctx.scheduler.runAfter(1000, internal.runs.clearStatuses, {
      workflowId: args.workflowId,
    });
    return status;
  },
});

/**
 * Runs a workflow's chain in the background: each workflow in the list, in
 * order, to completion before the next starts. Scheduled by `run` once the main
 * workflow finishes, so pressing "Run Workflow" also runs whatever follows it.
 */
export const runChainSequence = internalAction({
  args: {
    sourceWorkflowId: v.id('workflows'),
    chainWorkflowIds: v.array(v.id('workflows')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const stepId of args.chainWorkflowIds) {
      const step = await ctx.runQuery(internal.workflows.chainStepCanvas, {
        sourceWorkflowId: args.sourceWorkflowId,
        stepWorkflowId: stepId,
      });
      // Skip a workflow that was deleted or moved out of the workspace.
      if (step === null) {
        continue;
      }
      await ctx.runAction(internal.runWorkflow.runChainStep, {
        workflowId: stepId,
        canvas: step.canvas,
      });
    }
    // Safety net: clear any step still flagged scheduled (e.g. one skipped
    // because it was deleted mid-run). Steps that ran already cleared theirs.
    await ctx.runMutation(internal.runs.clearScheduled, {
      workflowIds: args.chainWorkflowIds,
    });
    return null;
  },
});

export const run = action({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    /** Injected into WEBHOOK nodes — set by the "send test event" button so a
     * manual run can simulate an inbound webhook payload. */
    webhookPayload: v.optional(v.string()),
  },
  returns: v.id('runHistory'),
  handler: async (ctx, args): Promise<Id<'runHistory'>> => {
    const workflow = await ctx.runQuery(api.workflows.get, {
      workspaceName: args.workspaceName,
      workflowId: args.workflowId,
    });
    if (workflow === null) {
      throw new ConvexError('Workflow not found.');
    }

    // Queue any chained workflows right away so they read as "Scheduled" (and
    // can't be run on their own) the moment this run starts.
    const chain = workflow.chainWorkflowIds ?? [];
    if (chain.length > 0) {
      await ctx.runMutation(internal.runs.markScheduled, {
        workflowIds: chain,
      });
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
        checkStop,
        makeFileReader(ctx, args.workflowId),
        args.webhookPayload
      );
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        status: 'success',
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId,
        status: 'success',
        nodeOutputs: remapOutputs(outputs, idMap),
      });
      await ctx.runMutation(internal.runs.markFinished, {
        workflowId: args.workflowId,
      });
      await ctx.scheduler.runAfter(1000, internal.runs.clearStatuses, {
        workflowId: args.workflowId,
      });
      // Once this workflow succeeds, run whatever is chained after it — in
      // order, in the background — so a single "Run Workflow" runs the sequence.
      if (chain.length > 0) {
        await ctx.scheduler.runAfter(0, internal.runWorkflow.runChainSequence, {
          sourceWorkflowId: args.workflowId,
          chainWorkflowIds: chain,
        });
      }
      return runHistoryId;
    } catch (error) {
      const stopped = error instanceof StopError;
      await ctx.runMutation(internal.workflows.recordRun, {
        workflowId: args.workflowId,
        status: stopped ? 'stopped' : 'error',
      });
      await ctx.runMutation(internal.runHistory.finish, {
        runHistoryId,
        status: stopped ? 'stopped' : 'error',
        nodeOutputs: {},
        error: runErrorMessage(stopped, error),
      });
      await ctx.runMutation(internal.runs.markFinished, {
        workflowId: args.workflowId,
      });
      await ctx.scheduler.runAfter(1000, internal.runs.clearStatuses, {
        workflowId: args.workflowId,
      });
      // The chain won't run (this workflow didn't succeed), so un-queue it.
      if (chain.length > 0) {
        await ctx.runMutation(internal.runs.clearScheduled, {
          workflowIds: chain,
        });
      }
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
  checkStop: () => Promise<boolean>,
  readFileContent: (fileId: string) => Promise<string>,
  webhookPayload: string | undefined
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

        case 'FILE_INPUT': {
          const fileId = getArgumentValue(node, 'file');
          if (fileId !== undefined && fileId !== null && fileId !== '') {
            output = await readFileContent(String(fileId));
            console.log(output);
          } else {
            // Legacy workflows stored inline content instead of a file id.
            output = String(getArgumentValue(node, 'content') ?? '');
          }
          break;
        }

        case 'WEBHOOK':
          // A webhook-triggered run injects the posted body; a manual editor
          // run falls back to the node's sample payload.
          output =
            webhookPayload !== undefined
              ? webhookPayload
              : String(getArgumentValue(node, 'payload') ?? '');
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

  // Inject the upstream input where the prompt asks for it. `{{text_input}}` is
  // canonical, but `{{input}}`/`{{file}}` are accepted so an intuitive guess
  // works too. With no placeholder at all, append the input rather than
  // silently dropping it (otherwise a prompt like "Explain this file" never
  // sees the file).
  const placeholder = /\{\{\s*(?:text_input|input|file)\s*\}\}/g;
  let content: string;
  if (placeholder.test(template)) {
    content = template.replace(placeholder, input);
  } else if (input) {
    content = template ? `${template}\n\n${input}` : input;
  } else {
    content = template;
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: String(getArgumentValue(node, 'model') ?? 'claude-sonnet-5'),
    max_tokens: Number(getArgumentValue(node, 'max_tokens')) || 1024,
    system: system || undefined,
    messages: [{ role: 'user', content }],
  });

  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}
