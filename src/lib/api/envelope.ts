/**
 * The backend's response envelope.
 *
 * Every 2xx body the API returns is `{ "data": ... }`. Errors are deliberately not
 * enveloped: they keep the `{ error, message }` shape, and `error` being present is
 * the discriminator. One helper unwraps one shape in one place, so an endpoint that
 * forgot its envelope fails loudly here rather than silently handing `undefined` to
 * a component.
 */

import type { ZodType } from "zod";

import { ApiError } from "lib/api/client";

export interface BaseResponse<T> {
  data: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  // Arrays are excluded on purpose: `[{...}]` is a bare payload, not an envelope,
  // and treating it as a record would let `data` be read off an array.
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Unwrap an enveloped body.
 *
 * @throws {ApiError} with code `invalid_response` when the body is not an envelope.
 * A missing `data` key means the contract is broken, not that the payload is empty:
 * an empty collection is `{ "data": [] }`, never `{ "data": null }`. A `data` value
 * that is merely falsy (`0`, `false`, `""`, `null`) is a legitimate payload and is
 * returned as-is.
 */
export function unwrapEnvelope(body: unknown): unknown {
  if (!isRecord(body) || !("data" in body) || body.data === undefined) {
    throw new ApiError(
      "invalid_response",
      "The API response was not in the documented envelope shape",
      502,
    );
  }
  return body.data;
}

/**
 * Unwrap an enveloped body and assert the documented shape of its payload.
 *
 * This is the runtime half of the module-owned wire types: the compiler cannot check a
 * hand-written interface against what the server sent, so a response that drives a form
 * or a decision is parsed here. A moved or renamed field becomes an `ApiError` with code
 * `invalid_response` — the same code a missing envelope raises — and the message names
 * the offending paths, which is what makes the failure actionable instead of an
 * `undefined` rendered three components down.
 */
export function parseEnvelope<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(unwrapEnvelope(body));
  if (result.success) {
    return result.data;
  }
  const paths = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
  throw new ApiError(
    "invalid_response",
    `The API response did not match the documented shape: ${paths.join(", ") || "unknown field"}`,
    502,
  );
}
