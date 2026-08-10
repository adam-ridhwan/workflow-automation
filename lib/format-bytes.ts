const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** A compact human-readable file size, e.g. "3.4 MB" or "812 B". */
export function formatBytes(bytes: number) {
  if (bytes < 1) {
    return '0 B';
  }
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1
  );
  const value = bytes / 1024 ** exponent;
  // Whole bytes have no decimals; larger units keep one significant decimal.
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded} ${UNITS[exponent]}`;
}
