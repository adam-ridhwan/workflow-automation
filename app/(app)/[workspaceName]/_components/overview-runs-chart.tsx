'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { OverviewRunsTooltip } from './overview-runs-tooltip';

type RunsDatum = { t: number; success: number; failed: number };

type OverviewRunsChartProps = {
  data: RunsDatum[];
};

// Status colors — emerald = success, red = failed. Same in light and dark.
const SUCCESS = '#10b981';
const FAILED = '#ef4444';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function dayLabel(t: number) {
  const date = new Date(t);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** Stacked-area chart of daily workflow runs (success + failed) over the
 * window, built with Recharts. Legend shows window totals; empty state when
 * there are no runs. */
export function OverviewRunsChart({ data }: OverviewRunsChartProps) {
  const chartData = data.map((day) => ({ ...day, label: dayLabel(day.t) }));
  const totalSuccess = data.reduce((sum, day) => sum + day.success, 0);
  const totalFailed = data.reduce((sum, day) => sum + day.failed, 0);
  const isEmpty = totalSuccess + totalFailed === 0;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-4 text-xs'>
        <span className='flex items-center gap-1.5'>
          <span className='size-2 rounded-[3px] bg-emerald-500' />
          <span className='text-muted-foreground'>Success</span>
          <span className='font-medium tabular-nums'>{totalSuccess}</span>
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='size-2 rounded-[3px] bg-red-500' />
          <span className='text-muted-foreground'>Failed</span>
          <span className='font-medium tabular-nums'>{totalFailed}</span>
        </span>
      </div>

      <div className='relative h-44'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              <linearGradient id='fill-success' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={SUCCESS} stopOpacity={0.3} />
                <stop offset='100%' stopColor={SUCCESS} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='fill-failed' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor={FAILED} stopOpacity={0.3} />
                <stop offset='100%' stopColor={FAILED} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke='var(--border)' />
            <XAxis
              dataKey='label'
              interval={3}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip
              content={<OverviewRunsTooltip />}
              cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.4 }}
            />
            <Area
              type='monotone'
              dataKey='success'
              stackId='runs'
              stroke={SUCCESS}
              strokeWidth={2}
              fill='url(#fill-success)'
              isAnimationActive={false}
            />
            <Area
              type='monotone'
              dataKey='failed'
              stackId='runs'
              stroke={FAILED}
              strokeWidth={2}
              fill='url(#fill-failed)'
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {isEmpty && (
          <div
            className='pointer-events-none absolute inset-0 flex items-center
              justify-center'
          >
            <span className='text-muted-foreground text-[13px]'>
              No runs in the last 14 days
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
