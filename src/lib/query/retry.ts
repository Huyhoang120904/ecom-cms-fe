import { ApiError } from "lib/api/client";

/**
 * Whether a failed query is worth retrying.
 *
 * React Query's default retries everything, including a `404` that will never
 * succeed and a `422` that is the server rejecting the request. Those are answers,
 * not blips, and retrying them delays the error state the page should be showing.
 *
 * A `5xx` and a transport failure are worth one more attempt.
 */
export function isRetriable(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) {
    return false;
  }
  if (error instanceof ApiError) {
    return error.status >= 500;
  }
  // Not an ApiError means the request never completed, which is the case a retry
  // is actually for.
  return true;
}
