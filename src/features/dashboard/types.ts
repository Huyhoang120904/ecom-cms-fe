/**
 * Domain types for the dashboard module.
 *
 * These derive from the generated OpenAPI contract, so a backend change to the
 * health schemas surfaces here as a type error instead of a silent drift.
 */

import type { components } from "lib/api/generated";

export type LivenessReadModel = components["schemas"]["LivenessResponse"];

export type ReadinessReadModel = components["schemas"]["ReadinessResponse"];

export type ReadinessStatus = ReadinessReadModel["status"];

export type DependencyName = "database" | "redis";
