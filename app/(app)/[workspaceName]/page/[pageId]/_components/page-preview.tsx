'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { useAction } from 'convex/react';

import { usePageStore } from '../_store/page-store';
import { PageComponentView } from './page-component-view';

import type { Id } from '@/convex/_generated/dataModel';

type FileOption = { _id: string; name: string };

type PagePreviewProps = {
  workspaceName: string;
  fileOptions: FileOption[];
};

export function PagePreview({ workspaceName, fileOptions }: PagePreviewProps) {
  const components = usePageStore((s) => s.components);
  const workflowId = usePageStore((s) => s.workflowId);
  const runForPage = useAction(api.runWorkflow.runForPage);

  const [values, setValues] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  const canRun = workflowId !== undefined && !running;

  async function handleRun() {
    if (workflowId === undefined) {
      toast.add({ type: 'error', title: 'Bind this page to a workflow first.' });
      return;
    }
    // Map each bound input component's current value to the workflow node it
    // feeds. Later components with the same binding win (last one wired).
    const runtimeInputs: Record<string, string> = {};
    for (const component of components) {
      if (
        (component.type === 'TEXT_INPUT' || component.type === 'FILE_INPUT') &&
        component.bindingNodeId
      ) {
        runtimeInputs[component.bindingNodeId] = values[component.id] ?? '';
      }
    }

    setRunning(true);
    try {
      const result = await runForPage({
        workspaceName,
        workflowId: workflowId as Id<'workflows'>,
        runtimeInputs,
      });
      setOutputs(result.outputs);
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error, 'The run failed.') });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className='min-h-0 flex-1 overflow-auto bg-background'>
      <div className='relative mx-auto min-h-full w-full max-w-5xl'>
        {components.map((component) => {
          const isInput =
            component.type === 'TEXT_INPUT' || component.type === 'FILE_INPUT';
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
              />
            </div>
          );
        })}

        {components.length === 0 && (
          <div
            className='text-muted-foreground absolute inset-0 flex items-center
              justify-center text-sm'
          >
            This page has no components yet.
          </div>
        )}
      </div>
    </div>
  );
}
