'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import {
  browserTimezone,
  buildCron,
  DEFAULT_BUILDER,
  WEEKDAYS,
} from '@/lib/cron';
import { errorMessage } from '@/lib/error-message';
import { useAction, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { Id } from '@/convex/_generated/dataModel';
import type { CronBuilderState, Frequency } from '@/lib/cron';

const FREQUENCY_LABELS: Record<Frequency, string> = {
  hourly: 'Every hour',
  daily: 'Every day',
  weekly: 'Every week',
  custom: 'Custom (cron)',
};

type AddScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddScheduleDialog({
  open,
  onOpenChange,
}: AddScheduleDialogProps) {
  const { workspaceId } = useWorkspaceParams();
  const workflows = useQuery(api.pages.workflowOptions, { workspaceId });
  const setSchedule = useAction(api.scheduleDispatch.set);
  const router = useRouter();

  const [workflowId, setWorkflowId] = useState('');
  const [builder, setBuilder] = useState<CronBuilderState>(DEFAULT_BUILDER);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<CronBuilderState>) {
    setBuilder((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (workflowId === '') {
      setError('Choose a workflow to schedule.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await setSchedule({
        workspaceId,
        workflowId: workflowId as Id<'workflows'>,
        cron: buildCron(builder),
        timezone: browserTimezone(),
        enabled: true,
      });
      onOpenChange(false);
      setWorkflowId('');
      setBuilder(DEFAULT_BUILDER);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the schedule.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <Field>
            <FieldLabel>Workflow</FieldLabel>
            <Select
              items={Object.fromEntries(
                (workflows ?? []).map((w) => [w._id, w.name])
              )}
              value={workflowId}
              onValueChange={(value) => {
                setWorkflowId(value ?? '');
              }}
            >
              <SelectTrigger size='sm' className='w-full'>
                <SelectValue placeholder='Choose a workflow…' />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {(workflows ?? []).map((w) => (
                  <SelectItem key={w._id} value={w._id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Frequency</FieldLabel>
            <Select
              items={FREQUENCY_LABELS}
              value={builder.frequency}
              onValueChange={(value) => {
                update({ frequency: value as Frequency });
              }}
            >
              <SelectTrigger size='sm' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {FREQUENCY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {builder.frequency === 'hourly' && (
            <Field>
              <FieldLabel>Minute of the hour</FieldLabel>
              <Input
                type='number'
                min={0}
                max={59}
                value={builder.minute}
                onChange={(e) => {
                  update({ minute: Number(e.target.value) });
                }}
              />
            </Field>
          )}

          {(builder.frequency === 'daily' || builder.frequency === 'weekly') && (
            <Field>
              <FieldLabel>Time</FieldLabel>
              <Input
                type='time'
                value={builder.time}
                onChange={(e) => {
                  update({ time: e.target.value });
                }}
              />
            </Field>
          )}

          {builder.frequency === 'weekly' && (
            <Field>
              <FieldLabel>Day</FieldLabel>
              <Select
                items={Object.fromEntries(WEEKDAYS.map((d, i) => [String(i), d]))}
                value={String(builder.weekday)}
                onValueChange={(value) => {
                  update({ weekday: Number(value) });
                }}
              >
                <SelectTrigger size='sm' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {WEEKDAYS.map((day, index) => (
                    <SelectItem key={day} value={String(index)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {builder.frequency === 'custom' && (
            <Field>
              <FieldLabel>Cron expression</FieldLabel>
              <Input
                value={builder.custom}
                placeholder='0 9 * * *'
                onChange={(e) => {
                  update({ custom: e.target.value });
                }}
              />
              <FieldDescription>
                Standard 5-field cron, in {browserTimezone()}.
              </FieldDescription>
            </Field>
          )}

          {error && (
            <p className='text-destructive text-sm'>{error}</p>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? 'Adding…' : 'Add schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
