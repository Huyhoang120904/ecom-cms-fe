import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { authKeys } from "./query-keys";
import { fetchMe } from "./api";
import type { Me } from "./types";

/**
 * The signed-in seller's identity and the shop their token is scoped to.
 *
 * Only enabled while a session is believed to exist: asking `/auth/me` with no
 * token would 401, which the transport would try to refresh, producing a spurious
 * refresh on every signed-out page load.
 *
 * Permissions come from this response, never from the token. The guard renders from
 * it, and the backend re-checks every request, so a stale cache can hide a button
 * but cannot authorize an action.
 */
export function useMeQuery(enabled: boolean): UseQueryResult<Me> {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchMe,
    enabled,
    // A failure here means the session is not usable, which is a state to render
    // rather than a transient error worth retrying.
    retry: false,
  });
}
