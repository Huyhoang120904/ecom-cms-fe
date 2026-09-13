import { describe, expect, it } from "vitest";

import {
  deactivateSchema,
  deleteShopSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  shopUpdateSchema,
  toProfilePayload,
  toShopPayload,
} from "features/auth/schemas";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      email: "seller@example.com",
      password: "a-perfectly-fine-password",
      full_name: "Nguyen Van A",
      shop_name: "Lamp Shop",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an 11-character password, matching the backend's minimum", () => {
    const result = registerSchema.safeParse({
      email: "seller@example.com",
      password: "elevenchars",
      full_name: "A",
      shop_name: "Shop",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a one-character shop name, matching the backend's minimum", () => {
    const result = registerSchema.safeParse({
      email: "seller@example.com",
      password: "a-perfectly-fine-password",
      full_name: "A",
      shop_name: "S",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a short password so the failure is not a length disclosure", () => {
    // Rejecting it here would tell an attacker the stored password is longer.
    const result = loginSchema.safeParse({ email: "a@b.co", password: "x" });
    expect(result.success).toBe(true);
  });

  it("requires both fields", () => {
    expect(loginSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("toProfilePayload", () => {
  it("omits a field that was never touched", () => {
    // An omitted key means unchanged. Sending null would clear it.
    expect(toProfilePayload({ bio: "Lamps." })).toEqual({ bio: "Lamps." });
  });

  it("sends an explicit null for a field the seller cleared", () => {
    expect(toProfilePayload({ bio: null })).toEqual({ bio: null });
  });

  it("omits full_name when it is null, because it may not be cleared", () => {
    expect(toProfilePayload({ full_name: null, bio: "x" })).toEqual({ bio: "x" });
  });

  it("keeps the distinction between omitted and null in one payload", () => {
    const payload = toProfilePayload({ full_name: "New Name", bio: null, phone: "+13128471928" });
    expect(payload).toEqual({ full_name: "New Name", bio: null, phone: "+13128471928" });
    expect("job_title" in payload).toBe(false);
  });
});

describe("toShopPayload", () => {
  it("never includes slug, so a rename cannot rewrite a public URL", () => {
    const payload = toShopPayload({ name: "Renamed" });
    expect("slug" in payload).toBe(false);
    expect(payload).toEqual({ name: "Renamed" });
  });

  it("passes an explicit null through as a clear", () => {
    expect(toShopPayload({ description: null })).toEqual({ description: null });
  });
});

describe("profileUpdateSchema", () => {
  it("accepts an empty object, which means change nothing", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a bio over 500 characters", () => {
    expect(profileUpdateSchema.safeParse({ bio: "x".repeat(501) }).success).toBe(false);
  });

  it("accepts a bio of exactly 500", () => {
    expect(profileUpdateSchema.safeParse({ bio: "x".repeat(500) }).success).toBe(true);
  });
});

describe("shopUpdateSchema", () => {
  it("rejects a malformed contact email", () => {
    expect(shopUpdateSchema.safeParse({ contact_email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a website without a scheme, which the backend also refuses", () => {
    expect(shopUpdateSchema.safeParse({ website: "example.com" }).success).toBe(false);
  });

  it("accepts an absolute website", () => {
    expect(shopUpdateSchema.safeParse({ website: "https://example.com" }).success).toBe(true);
    expect(shopUpdateSchema.safeParse({ website: "http://example.com" }).success).toBe(true);
  });

  it("accepts an empty website, which means clear it", () => {
    expect(shopUpdateSchema.safeParse({ website: "" }).success).toBe(true);
  });
});

describe("deactivateSchema and deleteShopSchema", () => {
  it("require the confirmation each one needs", () => {
    expect(deactivateSchema.safeParse({ password: "" }).success).toBe(false);
    expect(deleteShopSchema.safeParse({ confirm_shop_name: "" }).success).toBe(false);
  });

  it("accept a valid confirmation", () => {
    expect(deactivateSchema.safeParse({ password: "a-perfectly-fine-password" }).success).toBe(true);
    expect(deleteShopSchema.safeParse({ confirm_shop_name: "Lamp Shop" }).success).toBe(true);
  });
});
