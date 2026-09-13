/**
 * Query keys for the auth module.
 *
 * There is one session, so there is one key. It is exported so `_app.tsx` can
 * seed and clear the same cache entry the queries read.
 */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};
