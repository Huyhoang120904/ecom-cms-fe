import { apiUrl, readJson } from "lib/api/client";

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

export async function fetchReadiness(): Promise<ReadinessReadModel> {
  const response = await fetch(apiUrl("/health/ready"), {
    headers: { accept: "application/json" },
  });
  return readinessSchema.parse(await readJson(response));
}
