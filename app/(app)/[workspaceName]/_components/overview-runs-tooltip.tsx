type RunsTooltipPayload = {
  payload: { label: string; success: number; failed: number };
};

type OverviewRunsTooltipProps = {
  active?: boolean;
  payload?: RunsTooltipPayload[];
};

/** Tooltip body for the runs chart; Recharts injects `active`/`payload`. */
export function OverviewRunsTooltip({
  active,
  payload,
}: OverviewRunsTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const day = payload[0].payload;
  return (
    <div
      className='bg-popover text-popover-foreground rounded-md border px-2 py-1
        text-[11px] whitespace-nowrap shadow-md'
    >
      <div className='font-medium'>{day.label}</div>
      <div className='text-muted-foreground'>
        {day.success} success · {day.failed} failed
      </div>
    </div>
  );
}
