import { ConvexError } from 'convex/values';

/**
 * The clean, user-facing message from a caught error. `ConvexError` carries it
 * in `.data` (with none of the `[CONVEX …] Server Error` wrapping that shows up
 * in `.message`); anything else — a plain `Error`, a redacted server error — is
 * not safe/clean to show, so we use `fallback`.
 */
export function errorMessage(
  error: unknown,
  fallback: string = 'Something went wrong'
): string {
  if (error instanceof ConvexError && typeof error.data === 'string') {
    return error.data;
  }
  return fallback;
}
