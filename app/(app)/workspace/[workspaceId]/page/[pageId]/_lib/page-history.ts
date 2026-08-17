import type { PageComponentData } from '@/convex/pageLayout';

/**
 * Undo/redo history for a page's component layout. Each committed save pushes a
 * stringified snapshot of the components; undo/redo move a pointer through the
 * stack. Snapshots are stringified so they're immutable and cheap to compare —
 * a save identical to the current snapshot is ignored, and recording after an
 * undo drops the now-stale redo entries ahead of the pointer.
 */
export class PageHistoryService {
  private stack: string[] = [];
  private pointer = -1;

  /** Reset to a single baseline snapshot, e.g. when a page loads. */
  reset(components: PageComponentData[]): void {
    this.stack = [JSON.stringify(components)];
    this.pointer = 0;
  }

  /** Record a committed snapshot, dropping any redo entries past the pointer. */
  record(components: PageComponentData[]): void {
    const serialized = JSON.stringify(components);
    if (serialized === this.stack[this.pointer]) {
      return;
    }
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(serialized);
    this.pointer = this.stack.length - 1;
  }

  undo(): PageComponentData[] | undefined {
    if (!this.canUndo()) {
      return undefined;
    }
    this.pointer -= 1;
    return this.snapshotAt(this.pointer);
  }

  redo(): PageComponentData[] | undefined {
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

  private snapshotAt(index: number): PageComponentData[] {
    return JSON.parse(this.stack[index]) as PageComponentData[];
  }
}
