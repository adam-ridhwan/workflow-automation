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
  PAGE_COMPONENT_META,
  snap,
} from '../_constants/page-component-meta';
import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';
import { bindableNodes } from '../_lib/bindable-nodes';
import { snapToComponents } from '../_lib/snap-to-components';
import { usePageStore } from '../_store/page-store';
import { PageEditCanvas } from './page-edit-canvas';
import { PagePalette } from './page-palette';
import { PagePreview } from './page-preview';
import { PagePropertiesPanel } from './page-properties-panel';
import { PageSaveIndicator } from './page-save-indicator';
import { PageWorkflowPicker } from './page-workflow-picker';

import type { Id } from '@/convex/_generated/dataModel';
import type { Page } from '@/convex/pages';
import type { PageComponentType } from '@/convex/pageLayout';
import type {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  Modifier,
} from '@dnd-kit/core';
import type { PalettePageDragData } from './page-palette-item';
import type { PlacedPageDragData } from './page-canvas-item';

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
  const { workspaceName } = useWorkspaceParams();
  const target = useMemo(
    () => ({ workspaceName, pageId: page._id }),
    [workspaceName, page._id]
  );

  const setPage = usePageStore((s) => s.setPage);
  const addComponent = usePageStore((s) => s.addComponent);
  const moveComponent = usePageStore((s) => s.moveComponent);
  const components = usePageStore((s) => s.components);
  const workflowId = usePageStore((s) => s.workflowId);
  const setGuides = usePageStore((s) => s.setGuides);

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [activePaletteType, setActivePaletteType] =
    useState<PageComponentType | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Seed the store from the server-loaded page exactly once.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    setPage(page.layout.components, page.workflowId, page.layout.version);
  }, [page, setPage]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // The bound workflow's canvas, fetched live so the binding dropdowns reflect
  // the latest input/output nodes.
  const boundWorkflow = useQuery(
    api.workflows.get,
    workflowId
      ? { workspaceName: target.workspaceName, workflowId }
      : 'skip'
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
      | PalettePageDragData
      | PlacedPageDragData
      | undefined;
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
    const others = store.components
      .filter((c) => c.id !== data.id)
      .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
    const result = snapToComponents(prospective, others);
    return {
      ...transform,
      x: transform.x + (result.x - prospective.x),
      y: transform.y + (result.y - prospective.y),
    };
  };

  // Guide lines are published from the move event (not the modifier, which runs
  // during render) so we never setState mid-render of DndContext.
  function handleDragMove(e: DragMoveEvent) {
    const data = e.active.data.current as
      | PalettePageDragData
      | PlacedPageDragData
      | undefined;
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
    const others = components
      .filter((c) => c.id !== data.id)
      .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
    const result = snapToComponents(prospective, others);
    setGuides(result.guideX, result.guideY);
  }

  function handleDragStart(e: DragStartEvent) {
    setGuides(null, null);
    const data = e.active.data.current as
      | PalettePageDragData
      | PlacedPageDragData
      | undefined;
    if (data && 'type' in data) {
      setActivePaletteType(data.type);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    setActivePaletteType(null);
    setGuides(null, null);
    const data = e.active.data.current as
      | PalettePageDragData
      | PlacedPageDragData
      | undefined;
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
      const others = components
        .filter((c) => c.id !== data.id)
        .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
      const result = snapToComponents(prospective, others);
      moveComponent(target, data.id, {
        x: result.guideX !== null ? result.x : snap(prospective.x),
        y: result.guideY !== null ? result.y : snap(prospective.y),
      });
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
      const scrollLeft = wrapperRef.current?.scrollLeft ?? 0;
      const scrollTop = wrapperRef.current?.scrollTop ?? 0;
      addComponent(target, data.type, {
        x: snap(pointerX - bounds.left + scrollLeft),
        y: snap(pointerY - bounds.top + scrollTop),
      });
    }
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Builder toolbar */}
      <div className='flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='truncate text-sm font-medium'>{page.name}</span>
        </div>
        <div className='flex items-center gap-2'>
          <PageSaveIndicator />
          <PageWorkflowPicker target={target} options={workflowOptions} />
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
          <div className='flex min-h-0 flex-1'>
            <PagePalette />
            <PageEditCanvas target={target} wrapperRef={wrapperRef} />
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
          workspaceName={target.workspaceName}
          fileOptions={fileOptions}
        />
      )}
    </div>
  );
}
