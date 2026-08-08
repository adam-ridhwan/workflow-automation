import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { Edge, Node } from '@xyflow/react';

export type CanvasSnapshot = {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
};

/**
 * Undo/redo history for the canvas. Each committed save pushes a stringified
 * snapshot of the nodes and edges; undo/redo move a pointer through the stack.
 * Snapshots are stringified so they're immutable and cheap to compare — a save
 * identical to the current snapshot is ignored, and recording after an undo
 * drops the now-stale redo entries ahead of the pointer.
 */
export class CanvasHistoryService {
  private stack: string[] = [];
  private pointer = -1;

  /** Reset to a single baseline snapshot, e.g. when a workflow loads. */
  reset(snapshot: CanvasSnapshot): void {
    this.stack = [JSON.stringify(snapshot)];
    this.pointer = 0;
  }

  /** Record a committed snapshot, dropping any redo entries past the pointer. */
  record(snapshot: CanvasSnapshot): void {
    const serialized = JSON.stringify(snapshot);
    if (serialized === this.stack[this.pointer]) {
      return;
    }
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(serialized);
    this.pointer = this.stack.length - 1;
  }

  undo(): CanvasSnapshot | undefined {
    if (!this.canUndo()) {
      return undefined;
    }
    this.pointer -= 1;
    return this.snapshotAt(this.pointer);
  }

  redo(): CanvasSnapshot | undefined {
    if (!this.canRedo()) {
      return undefined;
    }
    this.pointer += 1;
    return this.snapshotAt(this.pointer);
  }

  canUndo(): boolean {
    return this.pointer > 0;
  }

  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  private snapshotAt(index: number): CanvasSnapshot {
    return JSON.parse(this.stack[index]) as CanvasSnapshot;
  }
}
