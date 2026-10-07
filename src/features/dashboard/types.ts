/**
 * Domain types for the dashboard module.
 *
 * Hand-written from the backend's health schemas (`ecom-be` `app/schemas/common`), so
 * this module no longer depends on a generated OpenAPI contract.
 */

/** Mirrors `LivenessResponse`: `GET /health/live` answers only when the process runs. */
export interface LivenessReadModel {
  status: "ok";
  service: string;
}

/**
 * Mirrors `ReadinessResponse`: `GET /health/ready` reports each dependency.
 *
 * A dependency key is not a fixed list — it is whatever the backend checks — so the
 * index signature stays open and the panel prints what it is given.
 */
export interface ReadinessReadModel {
  status: "ok" | "not_ready";
  dependencies: Record<string, "ok" | "unavailable">;
}

export type ReadinessStatus = ReadinessReadModel["status"];

export type DependencyName = "database" | "redis";
