import { z } from "zod";

/**
 * Validation schemas for the dashboard module.
 *
 * The backend health endpoints are the only real operational signal available,
 * so their payloads are validated before a component reads them.
 */

export const livenessSchema = z.object({
  status: z.literal("ok"),
  service: z.string().min(1),
});

export const readinessSchema = z.object({
  status: z.enum(["ok", "not_ready"]),
  dependencies: z.object({
    database: z.enum(["ok", "unavailable"]),
    redis: z.enum(["ok", "unavailable"]),
  }),
});

export type LivenessPayload = z.infer<typeof livenessSchema>;
export type ReadinessPayload = z.infer<typeof readinessSchema>;
