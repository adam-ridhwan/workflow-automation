'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import {
  browserTimezone,
  buildCron,
  DEFAULT_BUILDER,
  formatInZone,
  parseCron,
  WEEKDAYS,
} from '@/lib/cron';
import { errorMessage } from '@/lib/error-message';
import { useAction, useMutation, useQuery } from 'convex/react';
import { CalendarClockIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

import type { CronBuilderState, Frequency } from '@/lib/cron';

const FREQUENCY_LABELS: Record<Frequency, string> = {
  hourly: 'Every hour',
  daily: 'Every day',
  weekly: 'Every week',
  custom: 'Custom (cron)',
};

/** Header control for a workflow's schedule: a cron-based auto-run configured
 * with friendly presets (or a raw cron expression). Runs fire in the browser's
 * timezone and are recorded to run history. */
export function WorkflowScheduleMenu() {
  const pathname = usePathname();
  const { workspaceName, workflowId } = useWorkspaceParams();
  const schedule = useQuery(api.schedules.getForWorkflow, {
    workspaceName,
    workflowId,
  });
  const setSchedule = useAction(api.scheduleDispatch.set);
  const removeSchedule = useMutation(api.schedules.remove);

  const [builder, setBuilder] = useState<CronBuilderState>(DEFAULT_BUILDER);
  const [busy, setBusy] = useState(false);

  if (!pathname.endsWith('/canvas')) {
    return null;
  }

  const isActive = schedule?.enabled ?? false;

  // Seed the builder from the stored schedule (or defaults) when the menu opens
  // — an event, so no effect-driven state sync.
  function seed() {
    setBuilder(schedule ? parseCron(schedule.cron) : DEFAULT_BUILDER);
  }

  function update(patch: Partial<CronBuilderState>) {
    setBuilder((prev) => ({ ...prev, ...patch }));
  }

  async function save(enabled: boolean) {
    setBusy(true);
    try {
      await setSchedule({
        workspaceName,
        workflowId,
        cron: buildCron(builder),
        timezone: schedule?.timezone ?? browserTimezone(),
        enabled,
      });
      toast.add({
        type: 'success',
        title: enabled ? 'Schedule saved.' : 'Schedule paused.',
      });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  // Quick enable/disable of the existing schedule without editing it.
  async function toggle(enabled: boolean) {
    if (!schedule) {
      // No schedule yet — the toggle applies the current builder.
      await save(enabled);
      return;
    }
    setBusy(true);
    try {
      await setSchedule({
        workspaceName,
        workflowId,
        cron: schedule.cron,
        timezone: schedule.timezone,
        enabled,
      });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await removeSchedule({ workspaceName, workflowId });
      toast.add({ type: 'success', title: 'Schedule removed.' });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          seed();
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label='Schedule'
                  className='relative'
                />
              }
            >
              <CalendarClockIcon className='size-4' />
              {isActive && (
                <span
                  className='bg-primary ring-background pointer-events-none
                    absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2'
                />
              )}
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent>Schedule</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align='end' className='w-72'>
        <div className='flex items-center justify-between px-2 py-1.5'>
          <div>
            <p className='text-[13px] font-medium'>Schedule</p>
            <p className='text-muted-foreground text-[11px]'>
              Auto-run this workflow on a repeating schedule.
            </p>
          </div>
          <Switch
            checked={isActive}
            disabled={busy || schedule === undefined}
            onCheckedChange={(checked) => {
              toggle(checked);
            }}
          />
        </div>

        <DropdownMenuSeparator />

        {isActive && schedule?.nextRunAt !== undefined && (
          <div className='px-2 py-1.5'>
            <p className='text-muted-foreground text-[11px] font-medium'>
              Next run
            </p>
            <p className='text-[13px]'>
              {formatInZone(schedule.nextRunAt, schedule.timezone)}
            </p>
          </div>
        )}

        {/* Frequency + its controls. */}
        <div className='flex flex-col gap-2 px-2 py-1.5'>
          <div className='flex flex-col gap-1'>
            <Label className='text-[11px]'>Frequency</Label>
            <Select
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
          </div>

          {builder.frequency === 'hourly' && (
            <div className='flex flex-col gap-1'>
              <Label className='text-[11px]'>Minute of the hour</Label>
              <Input
                type='number'
                min={0}
                max={59}
                value={builder.minute}
                onChange={(e) => {
                  update({ minute: Number(e.target.value) });
                }}
              />
            </div>
          )}

          {(builder.frequency === 'daily' ||
            builder.frequency === 'weekly') && (
            <div className='flex flex-col gap-1'>
              <Label className='text-[11px]'>Time</Label>
              <Input
                type='time'
                value={builder.time}
                onChange={(e) => {
                  update({ time: e.target.value });
                }}
              />
            </div>
          )}

          {builder.frequency === 'weekly' && (
            <div className='flex flex-col gap-1'>
              <Label className='text-[11px]'>Day of week</Label>
              <Select
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
            </div>
          )}

          {builder.frequency === 'custom' && (
            <div className='flex flex-col gap-1'>
              <Label className='text-[11px]'>Cron expression</Label>
              <Input
                value={builder.custom}
                placeholder='0 9 * * *'
                spellCheck={false}
                className='font-mono'
                onChange={(e) => {
                  update({ custom: e.target.value });
                }}
              />
              <p className='text-muted-foreground text-[11px]'>
                Standard 5-field cron, in {browserTimezone()}.
              </p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className='flex items-center gap-2 px-2 py-1.5'>
          {schedule && (
            <Button
              size='sm'
              variant='ghost'
              disabled={busy}
              onClick={() => {
                remove();
              }}
            >
              Remove
            </Button>
          )}

          <Button
            size='sm'
            className='flex-1'
            disabled={busy}
            onClick={() => {
              save(true);
            }}
          >
            {schedule ? 'Update schedule' : 'Save schedule'}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
