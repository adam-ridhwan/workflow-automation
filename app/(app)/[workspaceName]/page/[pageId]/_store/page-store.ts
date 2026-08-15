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
  setWorkflowId: (
    target: SaveTarget,
    workflowId: Id<'workflows'> | undefined
  ) => void;

  saveLayout: (target: SaveTarget) => void;
};

export const usePageStore = create<PageBuilderState>((set, get) => ({
  components: [],
  workflowId: undefined,
  version: 1,
  selectedId: null,
  saveStatus: 'saved',

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

  setWorkflowId: (target, workflowId) => {
    set({ workflowId });
    convex
      .mutation(api.pages.setWorkflow, {
        workspaceName: target.workspaceName,
        pageId: target.pageId,
        workflowId: workflowId ?? null,
      })
      .catch(() => {
        set({ saveStatus: 'error' });
      });
  },

  saveLayout: (target) => {
    const { components, version } = get();
    set({ saveStatus: 'saving' });
    convex
      .mutation(api.pages.updateLayout, {
        workspaceName: target.workspaceName,
        pageId: target.pageId,
        layout: { components, version },
      })
      .then(() => {
        set({ saveStatus: 'saved' });
      })
      .catch(() => {
        set({ saveStatus: 'error' });
      });
  },
}));
