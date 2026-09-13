import { ApiError } from "lib/api/client";
import { unwrapEnvelope } from "lib/api/envelope";
import { authFetch } from "lib/auth/session";

import type { LivenessReadModel, ReadinessReadModel } from "./types";
import { livenessSchema, readinessSchema } from "./schemas";

/**
 * Transport calls owned by the dashboard module.
 *
 * Only this file knows the dashboard endpoints; components call the module query
 * hooks instead. Runtime payloads are unwrapped and then validated with the module
 * schema before a component can read them.
 */

export async function fetchLiveness(): Promise<LivenessReadModel> {
  const response = await authFetch("/health/live");
  return livenessSchema.parse(unwrapEnvelope(await response.json().catch(() => null)));
}

/**
 * Read backend readiness.
 *
 * The contract publishes the same envelope for `200` and for the `503` used when a
 * dependency is down, so a `503` is a successful read of a real "not ready" state
 * rather than a transport failure. That is why there is no special body-parsing
 * branch here any more: the status code is the signal and the shape is identical.
 */
export async function fetchReadiness(): Promise<ReadinessReadModel> {
  const response = await authFetch("/health/ready");

  if (!response.ok && response.status !== 503) {
    throw new ApiError(
      "readiness_unavailable",
      `Readiness probe failed with ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  return readinessSchema.parse(unwrapEnvelope(await response.json().catch(() => null)));
}
