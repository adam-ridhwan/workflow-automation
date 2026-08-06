const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Absolute date/time; defaults to a short "Aug 6, 7:01 PM" style. */
function formatAbsolute(ms: number, options?: Intl.DateTimeFormatOptions) {
  return new Date(ms).toLocaleString(
    undefined,
    options ?? {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

/** Relative time ("Just now", "5 minutes ago") that falls back to an absolute
 * date once it's older than a day. */
export function formatTime(timestamp: number) {
  const elapsed = Date.now() - timestamp;

  if (elapsed < MINUTE) {
    return 'Just now';
  }

  if (elapsed < HOUR) {
    const minutes = Math.floor(elapsed / MINUTE);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (elapsed < DAY) {
    const hours = Math.floor(elapsed / HOUR);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  return formatAbsolute(timestamp, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
