/**
 * Query keys for the dashboard module.
 *
 * Keys are hierarchical so a future invalidation can target this module's data
 * without knowing each hook's arguments.
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  liveness: () => [...dashboardKeys.all, "liveness"] as const,
  readiness: () => [...dashboardKeys.all, "readiness"] as const,
};
