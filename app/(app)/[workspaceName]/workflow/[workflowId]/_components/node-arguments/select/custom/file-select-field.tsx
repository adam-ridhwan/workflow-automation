'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useCanvasStore } from '../../../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../../../_hooks/use-workspace-params';
import { useCanvasMode } from '../../../workflow-canvas/canvas-mode-context';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { NodeArgument } from '@/lib/node-specs';

type FileSelectFieldProps = {
  fieldId: string;
  nodeId: string;
  data: WorkflowNodeData;
  argument: NodeArgument;
};

/** Picks one of the workspace's uploaded files for a node argument, storing the
 * selected file's id. Only fully-indexed files are selectable — those are the
 * ones the executor can read at run time. */
export function FileSelectField({
  fieldId,
  nodeId,
  data,
  argument,
}: FileSelectFieldProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const setNodeArgument = useCanvasStore((s) => s.setNodeArgument);
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);
  const { readOnly } = useCanvasMode();

  const files = useQuery(api.files.list, { workspaceName });
  const options = (files ?? []).filter((file) => file.status === 'indexed');

  const value = data.arguments[argument.name];
  const stringValue =
    value === undefined || value === null ? '' : String(value);

  const disabled = isRunning || readOnly || files === undefined;

  return (
    <Select
      disabled={disabled}
      value={stringValue}
      onValueChange={(next) => {
        setNodeArgument(nodeId, argument.name, next);
        saveWorkflow({ workspaceName, workflowId });
      }}
    >
      <SelectTrigger id={fieldId} size='sm' className='w-full'>
        {/* Map the stored file id back to its name; base-ui's SelectValue shows
            the raw value otherwise. */}
        <SelectValue>
          {(selected) => {
            const file =
              typeof selected === 'string'
                ? options.find((option) => option._id === selected)
                : undefined;
            if (file) {
              return file.name;
            }
            return (
              <span className='text-muted-foreground'>
                {files === undefined ? 'Loading…' : 'Select a file'}
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      {/* Anchor below the trigger; the canvas zoom transform throws off the
          default selected-item overlap positioning. */}
      <SelectContent alignItemWithTrigger={false}>
        {options.length === 0 ? (
          <div className='text-muted-foreground px-2 py-1.5 text-[13px]'>
            No files uploaded yet.
          </div>
        ) : (
          options.map((file) => (
            <SelectItem key={file._id} value={file._id}>
              {file.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
