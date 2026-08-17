'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { usePageStore } from '../_store/page-store';

import type { Id } from '@/convex/_generated/dataModel';

const NO_WORKFLOW = '__none__';

type WorkflowOption = { _id: Id<'workflows'>; name: string };

type PageWorkflowPickerProps = {
  target: { workspaceId: Id<'workspaces'>; pageId: Id<'pages'> };
  options: WorkflowOption[];
};

export function PageWorkflowPicker({ target, options }: PageWorkflowPickerProps) {
  const workflowId = usePageStore((s) => s.workflowId);
  const setWorkflowId = usePageStore((s) => s.setWorkflowId);

  // Maps each value to its label so the trigger shows the workflow name rather
  // than the raw id.
  const items: Record<string, string> = {
    [NO_WORKFLOW]: '— No workflow —',
    ...Object.fromEntries(options.map((option) => [option._id, option.name])),
  };

  return (
    <Select
      items={items}
      value={workflowId ?? NO_WORKFLOW}
      onValueChange={(value) => {
        setWorkflowId(
          target,
          value === NO_WORKFLOW ? undefined : (value as Id<'workflows'>)
        );
      }}
    >
      <SelectTrigger size='sm' className='w-56'>
        <SelectValue placeholder='Pick a workflow…' />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectItem value={NO_WORKFLOW}>— No workflow —</SelectItem>
        {options.map((option) => (
          <SelectItem key={option._id} value={option._id}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
