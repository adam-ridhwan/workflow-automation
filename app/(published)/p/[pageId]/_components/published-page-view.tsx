'use client';

import { useState } from 'react';
import { PageComponentView } from '@/app/(app)/workspace/[workspaceId]/page/[pageId]/_components/page-component-view';
import { isInputComponent } from '@/app/(app)/workspace/[workspaceId]/page/[pageId]/_constants/page-component-meta';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { useAction } from 'convex/react';

import type { Id } from '@/convex/_generated/dataModel';
import type { PageComponentData } from '@/convex/pageLayout';

type FileOption = { _id: string; name: string };

type PublishedPageViewProps = {
  page: {
    _id: string;
    name: string;
    workspaceId: Id<'workspaces'>;
    workflowId?: Id<'workflows'>;
    layout: { components: PageComponentData[]; version: number };
  };
  fileOptions: FileOption[];
};

/** Renders a published page's components in live/run mode, chrome-free. Same
 * runtime as the builder's Preview, but read from the published payload. */
export function PublishedPageView({ page, fileOptions }: PublishedPageViewProps) {
  const runForPage = useAction(api.runWorkflow.runForPage);
  const [values, setValues] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  const components = page.layout.components;
  const workflowId = page.workflowId;
  const canRun = workflowId !== undefined && !running;

  async function handleRun() {
    if (workflowId === undefined) {
      toast.add({ type: 'error', title: 'This page has no workflow.' });
      return;
    }
    const runtimeInputs: Record<string, string> = {};
    for (const component of components) {
      if (isInputComponent(component.type) && component.bindingNodeId) {
        runtimeInputs[component.bindingNodeId] = values[component.id] ?? '';
      }
    }
    setRunning(true);
    try {
      const result = await runForPage({
        workspaceId: page.workspaceId,
        workflowId,
        runtimeInputs,
      });
      setOutputs(result.outputs);
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error, 'The run failed.') });
    } finally {
      setRunning(false);
    }
  }

  function handleClear() {
    setValues({});
    setOutputs({});
  }

  return (
    <div className='bg-background min-h-screen w-full overflow-auto'>
      <div className='relative mx-auto min-h-screen w-full max-w-5xl'>
        {components.map((component) => {
          const isInput = isInputComponent(component.type);
          const outputValue = component.bindingNodeId
            ? outputs[component.bindingNodeId]
            : undefined;
          return (
            <div
              key={component.id}
              className='absolute p-1'
              style={{
                left: component.x,
                top: component.y,
                width: component.w,
                height: component.h,
              }}
            >
              <PageComponentView
                component={component}
                mode='preview'
                value={isInput ? (values[component.id] ?? '') : undefined}
                onValueChange={(next) => {
                  setValues((prev) => ({ ...prev, [component.id]: next }));
                }}
                fileOptions={fileOptions}
                outputValue={outputValue}
                isRunning={running}
                canRun={canRun}
                onRun={handleRun}
                onClear={handleClear}
              />
            </div>
          );
        })}

        {components.length === 0 && (
          <div
            className='text-muted-foreground absolute inset-0 flex items-center
              justify-center text-sm'
          >
            This page has no components.
          </div>
        )}
      </div>
    </div>
  );
}
