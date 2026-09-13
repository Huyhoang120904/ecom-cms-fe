import { describe, expect, it } from "vitest";

import { ApiError } from "lib/api/client";
import { unwrapEnvelope } from "lib/api/envelope";

describe("unwrapEnvelope", () => {
  it("returns the data payload", () => {
    expect(unwrapEnvelope({ data: { id: "abc" } })).toEqual({ id: "abc" });
  });

  it("accepts a falsy but defined payload", () => {
    expect(unwrapEnvelope({ data: 0 })).toBe(0);
    expect(unwrapEnvelope({ data: false })).toBe(false);
    expect(unwrapEnvelope({ data: null })).toBeNull();
    expect(unwrapEnvelope({ data: "" })).toBe("");
  });

  it("accepts an empty list, which is how an empty collection is expressed", () => {
    expect(unwrapEnvelope({ data: [] })).toEqual([]);
  });

  it("rejects a body that is not an object", () => {
    expect(() => unwrapEnvelope("nope")).toThrow(ApiError);
    expect(() => unwrapEnvelope(null)).toThrow(ApiError);
    expect(() => unwrapEnvelope(undefined)).toThrow(ApiError);
    expect(() => unwrapEnvelope(42)).toThrow(ApiError);
  });

  it("rejects an array body, which is not an envelope", () => {
    expect(() => unwrapEnvelope([{ id: "a" }])).toThrow(ApiError);
  });

  it("rejects a body with no data key", () => {
    expect(() => unwrapEnvelope({ items: [] })).toThrow(ApiError);
  });

  it("rejects an undefined payload, which means the server sent no envelope", () => {
    expect(() => unwrapEnvelope({ data: undefined })).toThrow(ApiError);
  });

  it("names the failure so a caller can distinguish it from a transport error", () => {
    try {
      unwrapEnvelope({});
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe("invalid_response");
    }
  });

  it("keeps the original payload identity rather than cloning it", () => {
    const payload = { id: "abc" };
    expect(unwrapEnvelope({ data: payload })).toBe(payload);
  });
});
