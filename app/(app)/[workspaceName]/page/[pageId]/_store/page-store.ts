import { convex } from '@/components/convev-client-provider';
import { api } from '@/convex/_generated/api';
import { create } from 'zustand';

import { PAGE_COMPONENT_META } from '../_constants/page-component-meta';

import type { Id } from '@/convex/_generated/dataModel';
import type { PageComponentData, PageComponentType } from '@/convex/pageLayout';

/** Identifies which page a mutating action should persist to. The store lives
 * outside React and can't read the URL, so callers pass this in. */
type SaveTarget = { workspaceName: string; pageId: Id<'pages'> };

type SaveStatus = 'saved' | 'saving' | 'error';

type PageBuilderState = {
  components: PageComponentData[];
  workflowId: Id<'workflows'> | undefined;
  version: number;
  selectedId: string | null;
  saveStatus: SaveStatus;
  /** Alignment guide lines (content coords) shown while dragging/resizing. */
  guideX: number | null;
  guideY: number | null;

  /** Seed the store from the server-loaded page (once, on mount). */
  setPage: (
    components: PageComponentData[],
    workflowId: Id<'workflows'> | undefined,
    version: number
  ) => void;

  addComponent: (
    target: SaveTarget,
    type: PageComponentType,
    position: { x: number; y: number }
  ) => void;
  moveComponent: (
    target: SaveTarget,
    id: string,
    position: { x: number; y: number }
  ) => void;
  resizeComponent: (
    target: SaveTarget,
    id: string,
    size: { w: number; h: number }
  ) => void;
  updateProps: (
    target: SaveTarget,
    id: string,
    props: Record<string, unknown>
  ) => void;
  setBinding: (
    target: SaveTarget,
    id: string,
    bindingNodeId: string | undefined
  ) => void;
  removeComponent: (target: SaveTarget, id: string) => void;
  select: (id: string | null) => void;
  setGuides: (x: number | null, y: number | null) => void;
  setWorkflowId: (
    target: SaveTarget,
    workflowId: Id<'workflows'> | undefined
  ) => void;

  saveLayout: (target: SaveTarget) => void;
};

type SetState = (partial: Partial<PageBuilderState>) => void;

/** Number of saves currently in flight, so `saveStatus` only flips back to
 * 'saved' once every pending write has settled. */
let pendingSaves = 0;

/** When the current run of saves started, and the minimum time to keep the
 * "Saving…" badge up — the writes are near-instant, so without a floor the
 * indicator just flashes. The real save is never slowed, only the badge. */
let savingSince = 0;
const MIN_SAVING_MS = 300;

function beginSave(set: SetState) {
  if (pendingSaves === 0) {
    savingSince = Date.now();
  }
  pendingSaves += 1;
  set({ saveStatus: 'saving' });
}

function endSaveSuccess(set: SetState) {
  pendingSaves -= 1;
  // Only the last write to settle clears the indicator, held up for at least
  // MIN_SAVING_MS so a near-instant save doesn't flash.
  if (pendingSaves === 0) {
    const remaining = MIN_SAVING_MS - (Date.now() - savingSince);
    if (remaining <= 0) {
      set({ saveStatus: 'saved' });
    } else {
      setTimeout(() => {
        if (pendingSaves === 0) {
          set({ saveStatus: 'saved' });
        }
      }, remaining);
    }
  }
}

function endSaveError(set: SetState) {
  pendingSaves -= 1;
  set({ saveStatus: 'error' });
}

export const usePageStore = create<PageBuilderState>((set, get) => ({
  components: [],
  workflowId: undefined,
  version: 1,
  selectedId: null,
  saveStatus: 'saved',
  guideX: null,
  guideY: null,

  setPage: (components, workflowId, version) => {
    set({ components, workflowId, version, selectedId: null });
  },

  addComponent: (target, type, position) => {
    const meta = PAGE_COMPONENT_META[type];
    const component: PageComponentData = {
      id: crypto.randomUUID(),
      type,
      x: Math.max(0, position.x),
      y: Math.max(0, position.y),
      w: meta.defaultSize.w,
      h: meta.defaultSize.h,
      props: { ...meta.defaultProps },
    };
    set((state) => ({
      components: [...state.components, component],
      selectedId: component.id,
    }));
    get().saveLayout(target);
  },

  moveComponent: (target, id, position) => {
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id
          ? { ...component, x: Math.max(0, position.x), y: Math.max(0, position.y) }
          : component
      ),
    }));
    get().saveLayout(target);
  },

  resizeComponent: (target, id, size) => {
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, w: size.w, h: size.h } : component
      ),
    }));
    get().saveLayout(target);
  },

  updateProps: (target, id, props) => {
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id
          ? { ...component, props: { ...component.props, ...props } }
          : component
      ),
    }));
    get().saveLayout(target);
  },

  setBinding: (target, id, bindingNodeId) => {
    set((state) => ({
      components: state.components.map((component) =>
        component.id === id ? { ...component, bindingNodeId } : component
      ),
    }));
    get().saveLayout(target);
  },

  removeComponent: (target, id) => {
    set((state) => ({
      components: state.components.filter((component) => component.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
    get().saveLayout(target);
  },

  select: (id) => {
    set({ selectedId: id });
  },

  setGuides: (x, y) => {
    set({ guideX: x, guideY: y });
  },

  setWorkflowId: (target, workflowId) => {
    set({ workflowId });
    beginSave(set);
    convex
      .mutation(api.pages.setWorkflow, {
        workspaceName: target.workspaceName,
        pageId: target.pageId,
        workflowId: workflowId ?? null,
      })
      .then(() => {
        endSaveSuccess(set);
      })
      .catch(() => {
        endSaveError(set);
      });
  },

  saveLayout: (target) => {
    const { components, version } = get();
    beginSave(set);
    convex
      .mutation(api.pages.updateLayout, {
        workspaceName: target.workspaceName,
        pageId: target.pageId,
        layout: { components, version },
      })
      .then(() => {
        endSaveSuccess(set);
      })
      .catch(() => {
        endSaveError(set);
      });
  },
}));
