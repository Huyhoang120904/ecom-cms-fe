import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deactivateAccount,
  fetchMe,
  login,
  logout,
  register,
  switchShop,
  uploadAvatar,
} from "features/auth/api";
import { clearSession, getAccessToken, setAccessToken } from "lib/auth/session";

const API = "http://localhost:8000";

const ME = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "seller@example.com",
    full_name: "Nguyen Van A",
    created_at: "2026-09-13T00:00:00Z",
  },
  active_shop: { id: "22222222-2222-4222-8222-222222222222", name: "Lamp Shop", slug: "lamp-shop" },
  memberships: [],
  permissions: ["shop:update"],
};

const SESSION = {
  access_token: "token-1",
  token_type: "bearer",
  expires_in: 900,
  user: ME.user,
  active_shop: ME.active_shop,
  memberships: [],
  permissions: ["shop:update"],
};

function envelope(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function headerKeys(init: RequestInit | undefined): string[] {
  return Object.keys(Object.fromEntries(new Headers(init?.headers).entries()));
}

describe("auth api", () => {
  beforeEach(() => {
    clearSession();
    process.env.NEXT_PUBLIC_API_URL = API;
    vi.restoreAllMocks();
  });

  it("registers and stores the returned token, so sign-up signs the seller in", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(envelope(SESSION, 201)));

    const session = await register({
      email: "seller@example.com",
      password: "a-perfectly-fine-password",
      full_name: "Nguyen Van A",
      shop_name: "Lamp Shop",
    });

    expect(session.access_token).toBe("token-1");
    expect(getAccessToken()).toBe("token-1");
  });

  it("registers with credentials so the refresh cookie is accepted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(envelope(SESSION, 201));
    vi.stubGlobal("fetch", fetchMock);

    await register({
      email: "seller@example.com",
      password: "a-perfectly-fine-password",
      full_name: "A",
      shop_name: "Shop",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
    expect(init.method).toBe("POST");
  });

  it("signs in and stores the token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(envelope(SESSION)));

    await login({ email: "seller@example.com", password: "a-perfectly-fine-password" });

    expect(getAccessToken()).toBe("token-1");
  });

  it("surfaces a bad password as an ApiError with the backend's code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_credentials", message: "Nope" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(
      login({ email: "seller@example.com", password: "wrong-password-entirely" }),
    ).rejects.toMatchObject({ code: "invalid_credentials", status: 401 });
    expect(getAccessToken()).toBeNull();
  });

  it("reads the profile out of the envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(envelope(ME)));

    const me = await fetchMe();

    expect(me.user.email).toBe("seller@example.com");
    expect(me.permissions).toContain("shop:update");
  });

  it("uploads an avatar without setting Content-Type by hand", async () => {
    setAccessToken("token-1");
    const fetchMock = vi.fn().mockResolvedValue(envelope(ME));
    vi.stubGlobal("fetch", fetchMock);

    await uploadAvatar(new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    // The browser must add `multipart/form-data; boundary=...` itself. Setting the
    // header by hand leaves the boundary out and FastAPI answers 422.
    expect(headerKeys(init).map((key) => key.toLowerCase())).not.toContain("content-type");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("stores the rotated token after switching shop", async () => {
    setAccessToken("token-1");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(envelope({ ...SESSION, access_token: "token-2", permissions: ["shop:read"] })),
    );

    const session = await switchShop({ shop_id: "22222222-2222-4222-8222-222222222222" });

    expect(session.access_token).toBe("token-2");
    expect(getAccessToken()).toBe("token-2");
  });

  it("clears local state on logout", async () => {
    setAccessToken("token-1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await logout();

    expect(getAccessToken()).toBeNull();
  });

  it("still clears local state when the logout request fails", async () => {
    // The alternative is telling the seller they are signed in when their token is
    // already gone from memory.
    setAccessToken("token-1");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(logout()).resolves.toBeUndefined();
    expect(getAccessToken()).toBeNull();
  });

  it("clears local state after a successful deactivation", async () => {
    setAccessToken("token-1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await deactivateAccount({ password: "a-perfectly-fine-password" });

    expect(getAccessToken()).toBeNull();
  });

  it("keeps local state when deactivation is rejected", async () => {
    // A failed deactivation must not sign the seller out of a live account.
    setAccessToken("token-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_credentials", message: "Wrong" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(
      deactivateAccount({ password: "wrong-password-entirely" }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
    expect(getAccessToken()).toBe("token-1");
  });

  it("reports a body that is not an envelope rather than returning undefined", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(ME), { status: 200 })));

    await expect(fetchMe()).rejects.toMatchObject({ code: "invalid_response" });
  });
});
