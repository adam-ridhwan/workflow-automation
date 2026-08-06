'use client';

import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import {
  toFlowEdges,
  toFlowNodes,
  WORKFLOW_EDGE,
  WORKFLOW_NODE,
} from '../../_lib/normalize';
import { CanvasModeContext } from '../workflow-canvas/canvas-mode-context';
import { WorkflowCanvasEdge } from '../workflow-canvas/workflow-canvas-edge';
import { WorkflowCanvasNode } from '../workflow-canvas/workflow-canvas-node';

import type { RunHistory, RunStatus } from '@/convex/runHistory';

import '@xyflow/react/dist/style.css';

const nodeTypes = { [WORKFLOW_NODE]: WorkflowCanvasNode };
const edgeTypes = { [WORKFLOW_EDGE]: WorkflowCanvasEdge };

type RunHistoryCanvasProps = {
  run: RunHistory;
};

/** Read-only canvas showing a single historical run's snapshot and outputs. */
export function RunHistoryCanvas({ run }: RunHistoryCanvasProps) {
  const nodes = useMemo(() => toFlowNodes(run.canvas), [run.canvas]);
  const edges = useMemo(() => toFlowEdges(run.canvas), [run.canvas]);

  // Per-node statuses recorded live during the run; older runs without them
  // fall back to marking every node that produced an output as a success.
  const nodeStatuses = useMemo(() => {
    if (run.nodeStatuses !== undefined) {
      return run.nodeStatuses;
    }
    const statuses: Record<string, RunStatus> = {};
    for (const nodeId of Object.keys(run.nodeOutputs)) {
      statuses[nodeId] = 'success';
    }
    return statuses;
  }, [run.nodeStatuses, run.nodeOutputs]);

  return (
    <CanvasModeContext.Provider
      value={{
        readOnly: true,
        run: { nodeStatuses, nodeOutputs: run.nodeOutputs },
      }}
    >
      <ReactFlowProvider>
        <div className='bg-canvas relative min-h-0 flex-1'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </CanvasModeContext.Provider>
  );
}
