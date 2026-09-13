/**
 * Public exports of the dashboard module.
 *
 * Routes and the shell import from this file, never from a deep path.
 */
export { default as DashboardPage } from "./components/dashboard-page";
export { dashboardKeys } from "./query-keys";
export { useLivenessQuery, useReadinessQuery } from "./queries";
export { livenessSchema, readinessSchema } from "./schemas";
export type { LivenessReadModel, ReadinessReadModel } from "./types";
