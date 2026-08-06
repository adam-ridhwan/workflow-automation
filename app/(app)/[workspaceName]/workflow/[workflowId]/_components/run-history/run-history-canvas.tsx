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

import type { RunHistory } from '@/convex/runHistory';

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

  // Mark every executed node (it has an output) as a success for the badges.
  const nodeStatuses = useMemo(() => {
    const statuses: Record<string, 'success'> = {};
    for (const nodeId of Object.keys(run.nodeOutputs)) {
      statuses[nodeId] = 'success';
    }
    return statuses;
  }, [run.nodeOutputs]);

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
