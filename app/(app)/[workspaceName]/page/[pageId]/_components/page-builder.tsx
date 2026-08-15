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
import { usePageStore } from '../_store/page-store';
import { PageEditCanvas } from './page-edit-canvas';
import { PagePalette } from './page-palette';
import { PagePreview } from './page-preview';
import { PagePropertiesPanel } from './page-properties-panel';
import { PageWorkflowPicker } from './page-workflow-picker';

import type { Id } from '@/convex/_generated/dataModel';
import type { Page } from '@/convex/pages';
import type { PageComponentType } from '@/convex/pageLayout';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { PalettePageDragData } from './page-palette-item';
import type { PlacedPageDragData } from './page-canvas-item';

type WorkflowOption = { _id: Id<'workflows'>; name: string };
type FileOption = { _id: string; name: string };

type PageBuilderProps = {
  page: Page;
  workflowOptions: WorkflowOption[];
  fileOptions: FileOption[];
};

const SAVE_LABELS: Record<'saved' | 'saving' | 'error', string> = {
  saved: 'Saved',
  saving: 'Saving…',
  error: 'Save failed',
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
  const saveStatus = usePageStore((s) => s.saveStatus);

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

  function handleDragStart(e: DragStartEvent) {
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
    const data = e.active.data.current as
      | PalettePageDragData
      | PlacedPageDragData
      | undefined;
    if (!data) {
      return;
    }

    // Reposition an existing component.
    if ('kind' in data && data.kind === 'placed') {
      const component = components.find((c) => c.id === data.id);
      if (!component) {
        return;
      }
      moveComponent(target, data.id, {
        x: snap(component.x + e.delta.x),
        y: snap(component.y + e.delta.y),
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
          <span className='text-muted-foreground text-xs'>
            {SAVE_LABELS[saveStatus]}
          </span>
        </div>
        <div className='flex items-center gap-2'>
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
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
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
