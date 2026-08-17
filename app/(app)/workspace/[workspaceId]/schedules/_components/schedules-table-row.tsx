'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { describeCron, formatInZone } from '@/lib/cron';
import { WorkflowIcon } from 'lucide-react';

import { resourceRowComposer } from '../../_components/resource-row-composer';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { WorkflowScheduleWithWorkflow } from '@/convex/schedules';

const ScheduleRow = resourceRowComposer<WorkflowScheduleWithWorkflow>();

function runTime(ms: number | undefined, timezone: string): string {
  return ms === undefined ? '—' : formatInZone(ms, timezone);
}

type SchedulesTableRowProps = {
  schedule: WorkflowScheduleWithWorkflow;
};

export function SchedulesTableRow({ schedule }: SchedulesTableRowProps) {
  const { workspaceId } = useWorkspaceParams();

  return (
    <ScheduleRow.Provider resource={schedule}>
      {/* Schedules aren't draggable — reuse the row shell with dragging off. */}
      <ScheduleRow.Row
        drag={{
          kind: 'workflow',
          id: schedule.workflowId,
          name: schedule.workflowName,
        }}
        dragDisabled
      >
        <ScheduleRow.NameCell
          icon={
            <WorkflowIcon className='text-muted-foreground size-4 shrink-0' />
          }
          name={schedule.workflowName}
          subtitle={`${describeCron(schedule.cron)} · ${schedule.timezone}`}
          href={`/workspace/${workspaceId}/workflow/${schedule.workflowId}/canvas`}
        />

        <ScheduleRow.Cell className='text-muted-foreground text-xs'>
          {schedule.enabled
            ? runTime(schedule.nextRunAt, schedule.timezone)
            : '—'}
        </ScheduleRow.Cell>

        <ScheduleRow.Cell className='text-muted-foreground text-xs'>
          {runTime(schedule.lastRunAt, schedule.timezone)}
        </ScheduleRow.Cell>

        <ScheduleRow.Cell>
          <Badge
            variant='secondary'
            className={cn(
              'gap-1.5 rounded-full',
              schedule.enabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <span className='size-1.25 rounded-full bg-current' />
            {schedule.enabled ? 'Active' : 'Paused'}
          </Badge>
        </ScheduleRow.Cell>

        <ScheduleRow.Actions>{null}</ScheduleRow.Actions>
      </ScheduleRow.Row>
    </ScheduleRow.Provider>
  );
}
