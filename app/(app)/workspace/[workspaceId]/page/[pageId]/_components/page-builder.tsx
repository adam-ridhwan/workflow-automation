'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useQuery } from 'convex/react';
import { PencilIcon, PlayIcon } from 'lucide-react';

import {
  CONTAINER_PADDING,
  PAGE_COMPONENT_META,
  snap,
} from '../_constants/page-component-meta';
import { bindableNodes } from '../_lib/bindable-nodes';
import { clampToContainer } from '../_lib/clamp-to-container';
import { snapToComponents } from '../_lib/snap-to-components';
import { usePageStore } from '../_store/page-store';
import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';
import { PageEditCanvas } from './page-edit-canvas';
import { PagePalette } from './page-palette';
import { PagePreview } from './page-preview';
import { PagePropertiesPanel } from './page-properties-panel';
import { PageSaveIndicator } from './page-save-indicator';
import { PageUndoRedoButtons } from './page-undo-redo-buttons';
import { PageWorkflowPicker } from './page-workflow-picker';

import type { Rect } from '../_lib/snap-to-components';
import type { PlacedPageDragData } from './page-canvas-item';
import type { PalettePageDragData } from './page-palette-item';
import type { Id } from '@/convex/_generated/dataModel';
import type { PageComponentType } from '@/convex/pageLayout';
import type { Page } from '@/convex/pages';
import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  Modifier,
} from '@dnd-kit/core';

type WorkflowOption = { _id: Id<'workflows'>; name: string };
type FileOption = { _id: string; name: string };

type PageBuilderProps = {
  page: Page;
  workflowOptions: WorkflowOption[];
  fileOptions: FileOption[];
};

export function PageBuilder({
  page,
  workflowOptions,
  fileOptions,
}: PageBuilderProps) {
  const { workspaceId } = useWorkspaceParams();
  const target = useMemo(
    () => ({ workspaceId, pageId: page._id }),
    [workspaceId, page._id]
  );

  const setPage = usePageStore((s) => s.setPage);
  const addComponent = usePageStore((s) => s.addComponent);
  const moveComponent = usePageStore((s) => s.moveComponent);
  const components = usePageStore((s) => s.components);
  const workflowId = usePageStore((s) => s.workflowId);
  const setGuides = usePageStore((s) => s.setGuides);

  const mode = usePageStore((s) => s.mode);
  const setMode = usePageStore((s) => s.setMode);
  const [activePaletteType, setActivePaletteType] =
    useState<PageComponentType | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Snap targets: every other component's rect, plus the bordered container's
  // own bounds so components can snap to its edges and center.
  const snapTargets = (excludeId: string) => {
    const rects: Rect[] = usePageStore
      .getState()
      .components.filter((c) => c.id !== excludeId)
      .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
    const el = wrapperRef.current;
    if (el) {
      rects.push({
        x: CONTAINER_PADDING,
        y: CONTAINER_PADDING,
        w: el.clientWidth - CONTAINER_PADDING * 2,
        h: el.clientHeight - CONTAINER_PADDING * 2,
        silent: true,
      });
    }
    return rects;
  };

  // The build surface's inner size, used to keep components within the padding
  // boundary. Null until the canvas has mounted.
  const containerSize = () => {
    const el = wrapperRef.current;
    return el ? { w: el.clientWidth, h: el.clientHeight } : null;
  };

  // Seed the store from the server-loaded page exactly once.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    setPage(page.layout.components, page.workflowId, page.layout.version);
  }, [page, setPage]);

  // Builder keyboard shortcuts (edit mode): delete, arrow-nudge, duplicate,
  // undo/redo. Ignored while typing in a field so the properties panel works.
  useEffect(() => {
    if (mode !== 'edit') {
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.tagName === 'SELECT' ||
        el?.isContentEditable === true;
      const store = usePageStore.getState();
      const modifier = e.metaKey || e.ctrlKey;

      if (modifier && (e.key === 'z' || e.key === 'Z')) {
        if (typing) {
          return;
        }
        e.preventDefault();
        if (e.shiftKey) {
          store.redo(target);
        } else {
          store.undo(target);
        }
        return;
      }

      const id = store.selectedId;
      if (typing || id === null) {
        return;
      }

      if (modifier && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        store.duplicateComponent(target, id);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        store.removeComponent(target, id);
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      const deltas: Record<string, [number, number]> = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const delta = deltas[e.key];
      if (delta) {
        const component = store.components.find((c) => c.id === id);
        if (component) {
          e.preventDefault();
          const next = {
            x: component.x + delta[0],
            y: component.y + delta[1],
          };
          const el = wrapperRef.current;
          store.moveComponent(
            target,
            id,
            el
              ? clampToContainer(
                  next,
                  { w: component.w, h: component.h },
                  { w: el.clientWidth, h: el.clientHeight }
                )
              : next
          );
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mode, target]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // The bound workflow's canvas, fetched live so the binding dropdowns reflect
  // the latest input/output nodes.
  const boundWorkflow = useQuery(
    api.workflows.get,
    workflowId ? { workspaceId: target.workspaceId, workflowId } : 'skip'
  );
  const { inputs, outputs } = useMemo(
    () =>
      boundWorkflow
        ? bindableNodes(boundWorkflow.canvas)
        : { inputs: [], outputs: [] },
    [boundWorkflow]
  );

  // dnd-kit modifier: while dragging a placed component, snap its transform so
  // its edges/center align with other components, and publish the guide lines.
  const snapModifier: Modifier = ({ transform, active }) => {
    const data = active?.data.current as
      PalettePageDragData | PlacedPageDragData | undefined;
    if (!data || !('kind' in data) || data.kind !== 'placed') {
      return transform;
    }
    const store = usePageStore.getState();
    const activeComponent = store.components.find((c) => c.id === data.id);
    if (!activeComponent) {
      return transform;
    }
    const prospective = {
      x: activeComponent.x + transform.x,
      y: activeComponent.y + transform.y,
      w: activeComponent.w,
      h: activeComponent.h,
    };
    const others = snapTargets(data.id);
    const result = snapToComponents(prospective, others);
    // Keep the component within the padding boundary regardless of the drag.
    const size = { w: activeComponent.w, h: activeComponent.h };
    const bounds = containerSize();
    const clamped = bounds ? clampToContainer(result, size, bounds) : result;
    return {
      ...transform,
      x: transform.x + (clamped.x - prospective.x),
      y: transform.y + (clamped.y - prospective.y),
    };
  };

  // Guide lines are published from the move event (not the modifier, which runs
  // during render) so we never setState mid-render of DndContext.
  function handleDragMove(e: DragMoveEvent) {
    const data = e.active.data.current as
      PalettePageDragData | PlacedPageDragData | undefined;
    if (!data || !('kind' in data) || data.kind !== 'placed') {
      return;
    }
    const activeComponent = components.find((c) => c.id === data.id);
    if (!activeComponent) {
      return;
    }
    const prospective = {
      x: activeComponent.x + e.delta.x,
      y: activeComponent.y + e.delta.y,
      w: activeComponent.w,
      h: activeComponent.h,
    };
    const others = snapTargets(data.id);
    const result = snapToComponents(prospective, others);
    setGuides(result.guideX, result.guideY);
  }

  function handleDragStart(e: DragStartEvent) {
    setGuides(null, null);
    const data = e.active.data.current as
      PalettePageDragData | PlacedPageDragData | undefined;
    if (data && 'type' in data) {
      setActivePaletteType(data.type);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActivePaletteType(null);
    setGuides(null, null);
    const data = e.active.data.current as
      PalettePageDragData | PlacedPageDragData | undefined;
    if (!data) {
      return;
    }

    // Reposition an existing component: align-snap to other components where one
    // is in range, otherwise fall back to the grid.
    if ('kind' in data && data.kind === 'placed') {
      const component = components.find((c) => c.id === data.id);
      if (!component) {
        return;
      }
      const prospective = {
        x: component.x + e.delta.x,
        y: component.y + e.delta.y,
        w: component.w,
        h: component.h,
      };
      const others = snapTargets(data.id);
      const result = snapToComponents(prospective, others);
      const next = {
        x: result.guideX !== null ? result.x : snap(prospective.x),
        y: result.guideY !== null ? result.y : snap(prospective.y),
      };
      const bounds = containerSize();
      moveComponent(
        target,
        data.id,
        bounds
          ? clampToContainer(next, { w: component.w, h: component.h }, bounds)
          : next
      );
      return;
    }

    // Drop a new component from the palette.
    if ('type' in data) {
      const activator = e.activatorEvent;
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!(activator instanceof PointerEvent) || !bounds) {
        return;
      }
      const pointerX = activator.clientX + e.delta.x;
      const pointerY = activator.clientY + e.delta.y;
      // Ignore drops that land outside the canvas (e.g. back on the palette).
      if (
        pointerX < bounds.left ||
        pointerX > bounds.right ||
        pointerY < bounds.top ||
        pointerY > bounds.bottom
      ) {
        return;
      }
      // Ignore drops that land on a floating panel rather than the canvas.
      if (
        document
          .elementFromPoint(pointerX, pointerY)
          ?.closest('[data-page-palette],[data-page-panel]')
      ) {
        return;
      }
      const scrollLeft = wrapperRef.current?.scrollLeft ?? 0;
      const scrollTop = wrapperRef.current?.scrollTop ?? 0;
      const dropped = {
        x: snap(pointerX - bounds.left + scrollLeft),
        y: snap(pointerY - bounds.top + scrollTop),
      };
      const size = PAGE_COMPONENT_META[data.type].defaultSize;
      const innerBounds = containerSize();
      addComponent(
        target,
        data.type,
        innerBounds ? clampToContainer(dropped, size, innerBounds) : dropped
      );
    }
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Builder toolbar */}
      <div
        className='flex h-12 shrink-0 items-center justify-between gap-3
          border-b px-4'
      >
        <div className='bg-muted flex items-center gap-0.5 rounded-lg p-0.5'>
          <Button
            size='sm'
            variant={mode === 'edit' ? 'outline' : 'ghost'}
            onClick={() => {
              setMode('edit');
            }}
          >
            <PencilIcon />
            Edit
          </Button>
          <Button
            size='sm'
            variant={mode === 'preview' ? 'outline' : 'ghost'}
            onClick={() => {
              setMode('preview');
            }}
          >
            <PlayIcon />
            Preview
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          {mode === 'edit' && (
            <>
              <PageSaveIndicator />
              <PageUndoRedoButtons target={target} />
              <PageWorkflowPicker target={target} options={workflowOptions} />
            </>
          )}
        </div>
      </div>

      {mode === 'edit' ? (
        <DndContext
          id='page-builder-dnd'
          sensors={sensors}
          modifiers={[snapModifier]}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActivePaletteType(null);
            setGuides(null, null);
          }}
        >
          <div className='relative flex min-h-0 flex-1'>
            <PageEditCanvas target={target} wrapperRef={wrapperRef} />
            <PagePalette />
            <PagePropertiesPanel
              target={target}
              inputNodes={inputs}
              outputNodes={outputs}
              hasWorkflow={workflowId !== undefined}
            />
          </div>
          <DragOverlay dropAnimation={null}>
            {activePaletteType ? (
              <div
                className={cn(
                  `bg-background flex items-center gap-2 rounded-lg border px-2
                    py-1.5 text-sm shadow-md`
                )}
              >
                {PAGE_COMPONENT_META[activePaletteType].label}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <PagePreview
          workspaceId={target.workspaceId}
          fileOptions={fileOptions}
        />
      )}
    </div>
  );
}
