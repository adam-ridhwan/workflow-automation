/** Helpers for the schedule builder: converting between the friendly preset
 * controls and the 5-field cron string the backend stores. */

export type Frequency = 'hourly' | 'daily' | 'weekly' | 'custom';

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** The builder controls' state; `buildCron` turns it into a cron string. */
export type CronBuilderState = {
  frequency: Frequency;
  /** Minute of the hour for the `hourly` preset (0–59). */
  minute: number;
  /** "HH:MM" wall-clock time for the `daily`/`weekly` presets. */
  time: string;
  /** Day of week for the `weekly` preset (0 = Sunday). */
  weekday: number;
  /** Raw cron expression for the `custom` preset. */
  custom: string;
};

export const DEFAULT_BUILDER: CronBuilderState = {
  frequency: 'daily',
  minute: 0,
  time: '09:00',
  weekday: 1,
  custom: '0 9 * * *',
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** Splits "HH:MM" into [hour, minute], clamped to valid ranges. */
function parseTime(time: string): [number, number] {
  const [h, m] = time.split(':');
  return [clamp(Number(h), 0, 23), clamp(Number(m), 0, 59)];
}

/** The cron string for the current builder state. */
export function buildCron(state: CronBuilderState): string {
  switch (state.frequency) {
    case 'hourly':
      return `${clamp(state.minute, 0, 59)} * * * *`;
    case 'daily': {
      const [hour, minute] = parseTime(state.time);
      return `${minute} ${hour} * * *`;
    }
    case 'weekly': {
      const [hour, minute] = parseTime(state.time);
      return `${minute} ${hour} * * ${clamp(state.weekday, 0, 6)}`;
    }
    case 'custom':
      return state.custom.trim();
  }
}

const HOURLY = /^(\d{1,2}) \* \* \* \*$/;
const DAILY = /^(\d{1,2}) (\d{1,2}) \* \* \*$/;
const WEEKLY = /^(\d{1,2}) (\d{1,2}) \* \* (\d)$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Recovers builder state from a stored cron so editing an existing schedule
 * shows the right preset. Falls back to the `custom` field. */
export function parseCron(cron: string): CronBuilderState {
  const trimmed = cron.trim();
  const base: CronBuilderState = { ...DEFAULT_BUILDER, custom: trimmed };

  const hourly = HOURLY.exec(trimmed);
  if (hourly) {
    return { ...base, frequency: 'hourly', minute: Number(hourly[1]) };
  }
  const daily = DAILY.exec(trimmed);
  if (daily) {
    return {
      ...base,
      frequency: 'daily',
      time: `${pad(Number(daily[2]))}:${pad(Number(daily[1]))}`,
    };
  }
  const weekly = WEEKLY.exec(trimmed);
  if (weekly) {
    return {
      ...base,
      frequency: 'weekly',
      time: `${pad(Number(weekly[2]))}:${pad(Number(weekly[1]))}`,
      weekday: Number(weekly[3]),
    };
  }
  return { ...base, frequency: 'custom' };
}

/** The browser's IANA timezone (e.g. "America/New_York"). */
export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** A run time formatted in the schedule's timezone. */
export function formatInZone(epochMs: number, timezone: string): string {
  return new Date(epochMs).toLocaleString(undefined, {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
