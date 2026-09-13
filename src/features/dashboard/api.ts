import { ApiError, apiUrl, readJson } from "lib/api/client";

import type { LivenessReadModel, ReadinessReadModel } from "./types";
import { livenessSchema, readinessSchema } from "./schemas";

/**
 * Transport calls owned by the dashboard module.
 *
 * Only this file knows the dashboard endpoints; components call the module
 * query hooks instead. Runtime payloads are validated with the module schema
 * before a component can read them.
 */

export async function fetchLiveness(): Promise<LivenessReadModel> {
  const response = await fetch(apiUrl("/health/live"), {
    headers: { accept: "application/json" },
  });
  return livenessSchema.parse(await readJson(response));
}

/**
 * Read backend readiness.
 *
 * The contract publishes the same `ReadinessResponse` body for `200` and for
 * the `503` used when a dependency is down, so a `503` is a successful read of
 * a real "not ready" state rather than a transport failure.
 */
export async function fetchReadiness(): Promise<ReadinessReadModel> {
  const response = await fetch(apiUrl("/health/ready"), {
    headers: { accept: "application/json" },
  });

  if (response.status === 503) {
    return readinessSchema.parse(await response.json());
  }

  if (!response.ok) {
    throw new ApiError(
      "readiness_unavailable",
      `Readiness probe failed with ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  return readinessSchema.parse(await readJson(response));
}
