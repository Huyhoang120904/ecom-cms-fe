import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "lib/api/client";
import {
  authFetch,
  clearSession,
  getAccessToken,
  refreshSession,
  setAccessToken,
  setSessionExpiredHandler,
} from "lib/auth/session";

const API = "http://localhost:8000";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function headersOf(init: RequestInit | undefined): Record<string, string> {
  return Object.fromEntries(new Headers(init?.headers).entries());
}

describe("session", () => {
  beforeEach(() => {
    clearSession();
    process.env.NEXT_PUBLIC_API_URL = API;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearSession();
    setSessionExpiredHandler(null);
  });

  describe("authFetch", () => {
    it("attaches the bearer token when one is held", async () => {
      setAccessToken("token-1");
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: { ok: true } }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${API}/api/v1/auth/me`);
      expect(headersOf(init).authorization).toBe("Bearer token-1");
    });

    it("sends no authorization header when signed out", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(headersOf(init).authorization).toBeUndefined();
    });

    it("sends credentials so the refresh cookie travels", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.credentials).toBe("include");
    });

    it("defaults the accept header to JSON", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me");

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(headersOf(init).accept).toBe("application/json");
    });

    it("preserves a caller-supplied method and body", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ bio: "Lamps." }),
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("PATCH");
      expect(init.body).toBe('{"bio":"Lamps."}');
    });

    it("does not set a Content-Type for a FormData body", async () => {
      // Setting it by hand omits the multipart boundary and the request fails with
      // a 422 that looks unrelated to the real cause.
      setAccessToken("token-1");
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      const form = new FormData();
      form.append("file", new Blob([new Uint8Array([1, 2, 3])]), "a.png");
      await authFetch("/api/v1/auth/me/avatar", { method: "POST", body: form });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(Object.keys(headersOf(init)).map((key) => key.toLowerCase())).not.toContain(
        "content-type",
      );
    });

    it("does not override a caller-supplied Content-Type", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me", {
        method: "POST",
        body: "raw",
        headers: { "content-type": "text/plain" },
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(headersOf(init)["content-type"]).toBe("text/plain");
    });
  });

  describe("refresh on a 401", () => {
    it("refreshes once and retries once", async () => {
      setAccessToken("stale");
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(401, { error: "invalid_token", message: "x" }))
        .mockResolvedValueOnce(jsonResponse(200, { data: { access_token: "fresh" } }))
        .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));
      vi.stubGlobal("fetch", fetchMock);

      const response = await authFetch("/api/v1/auth/me");

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(getAccessToken()).toBe("fresh");
    });

    it("retries the original request with the fresh token", async () => {
      setAccessToken("stale");
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(401, {}))
        .mockResolvedValueOnce(jsonResponse(200, { data: { access_token: "fresh" } }))
        .mockResolvedValueOnce(jsonResponse(200, { data: {} }));
      vi.stubGlobal("fetch", fetchMock);

      await authFetch("/api/v1/auth/me");

      const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
      expect(headersOf(retryInit).authorization).toBe("Bearer fresh");
    });

    it("does not refresh a second time when the retry also 401s", async () => {
      setAccessToken("stale");
      const expired = vi.fn();
      setSessionExpiredHandler(expired);
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(401, {}))
        .mockResolvedValueOnce(jsonResponse(200, { data: { access_token: "fresh" } }))
        .mockResolvedValueOnce(jsonResponse(401, {}));
      vi.stubGlobal("fetch", fetchMock);

      const response = await authFetch("/api/v1/auth/me");

      // The retry's 401 is final: three calls, not five, and no infinite loop.
      expect(response.status).toBe(401);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("passes a non-401 failure straight back to the caller", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(403, { error: "forbidden" }));
      vi.stubGlobal("fetch", fetchMock);

      const response = await authFetch("/api/v1/shops/active");

      expect(response.status).toBe(403);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not refresh a 401 that means wrong credentials, not an ended session", async () => {
      // Deactivating with a mistyped password answers 401 invalid_credentials. A
      // refresh here would bury "wrong password" under a session error, and would
      // rotate the cookie for no reason.
      setAccessToken("token-1");
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          jsonResponse(401, { error: "invalid_credentials", message: "Authentication failed" }),
        );
      vi.stubGlobal("fetch", fetchMock);

      const response = await authFetch("/api/v1/auth/deactivate", { method: "POST" });

      expect(response.status).toBe(401);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe("token-1");
    });

    it("leaves the body readable after inspecting the 401 code", async () => {
      // The check parses the body to read `error`, so it must clone first or the
      // caller's own readJson would see an already-consumed stream.
      setAccessToken("token-1");
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(jsonResponse(401, { error: "invalid_credentials", message: "Nope" })),
      );

      const response = await authFetch("/api/v1/auth/deactivate", { method: "POST" });
      const body = (await response.json()) as { error: string };

      expect(body.error).toBe("invalid_credentials");
    });
  });

  describe("refreshSession", () => {
    it("stores the returned token", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse(200, { data: { access_token: "fresh" } })),
      );

      await refreshSession();

      expect(getAccessToken()).toBe("fresh");
    });

    it("posts to the refresh path with credentials", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(jsonResponse(200, { data: { access_token: "fresh" } }));
      vi.stubGlobal("fetch", fetchMock);

      await refreshSession();

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${API}/api/v1/auth/refresh`);
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("include");
    });

    it("never retries the refresh call itself, because it is the recovery path", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, {}));
      vi.stubGlobal("fetch", fetchMock);

      await expect(refreshSession()).rejects.toBeInstanceOf(ApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("clears the session and notifies when the refresh fails", async () => {
      setAccessToken("stale");
      const expired = vi.fn();
      setSessionExpiredHandler(expired);
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, {})));

      await expect(refreshSession()).rejects.toBeInstanceOf(ApiError);

      expect(getAccessToken()).toBeNull();
      expect(expired).toHaveBeenCalledTimes(1);
    });

    it("rejects a response that carries no token", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { data: {} })));

      await expect(refreshSession()).rejects.toMatchObject({ code: "invalid_response" });
    });

    it("collapses concurrent refreshes into one request", async () => {
      // Without single-flight, the second and third refreshes would present an
      // already-rotated cookie and trip the backend's reuse detection, signing the
      // user out for being busy.
      let release: ((value: Response) => void) | undefined;
      const fetchMock = vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            release = resolve;
          }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const first = refreshSession();
      const second = refreshSession();
      const third = refreshSession();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      release?.(jsonResponse(200, { data: { access_token: "fresh" } }));
      await Promise.all([first, second, third]);

      expect(getAccessToken()).toBe("fresh");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("allows a later refresh after the in-flight one settles", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(200, { data: { access_token: "one" } }))
        .mockResolvedValueOnce(jsonResponse(200, { data: { access_token: "two" } }));
      vi.stubGlobal("fetch", fetchMock);

      await refreshSession();
      await refreshSession();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(getAccessToken()).toBe("two");
    });
  });

  describe("token storage", () => {
    it("keeps the token in memory only, never in browser storage", async () => {
      const setItem = vi.spyOn(Storage.prototype, "setItem");
      setAccessToken("token-1");

      expect(setItem).not.toHaveBeenCalled();
      expect(getAccessToken()).toBe("token-1");
    });

    it("clearSession drops the token", () => {
      setAccessToken("token-1");

      clearSession();

      expect(getAccessToken()).toBeNull();
    });
  });
});
