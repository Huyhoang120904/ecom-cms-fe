/**
 * Session state and authenticated transport.
 *
 * Two decisions carry the security of this module:
 *
 * 1. The access token lives in a module variable, never in `localStorage` or a
 *    readable cookie. An XSS payload cannot read a variable in a closure; it can
 *    read `localStorage` in one line.
 * 2. The refresh token is never touched by JavaScript at all. It is an httpOnly
 *    cookie the browser attaches on its own, which is why every call here sets
 *    `credentials: "include"`.
 *
 * The 401 recovery path is single-flight. If several requests fail at once, they
 * share one refresh call: refreshing per request would present an already-rotated
 * cookie on the second call, which the backend correctly reads as token reuse and
 * answers by revoking the entire family.
 */

import { ApiError, apiUrl } from "lib/api/client";
import { unwrapEnvelope } from "lib/api/envelope";

let accessToken: string | null = null;
let refreshInFlight: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

/** Replace the in-memory access token. Pass `null` when signing out. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** The current access token, or `null` when signed out. */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Drop all client-side session state. Does not call the API. */
export function clearSession(): void {
  accessToken = null;
  refreshInFlight = null;
}

/**
 * Register the callback fired when the session ends and cannot be recovered.
 *
 * `_app.tsx` uses this to send the seller to the sign-in page from wherever they
 * are, including from inside a background request.
 */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

function notifySessionExpired(): void {
  const handler = onSessionExpired;
  // Cleared first so a handler that signs out cannot re-enter this path.
  onSessionExpired = null;
  handler?.();
}

interface SessionPayload {
  access_token?: unknown;
}

/**
 * Exchange the refresh cookie for a fresh access token.
 *
 * @throws {ApiError} When the refresh fails; the session is cleared first.
 *
 * Never retries on failure: this call *is* the retry path, and retrying it would
 * loop. Concurrent callers share one in-flight request.
 */
export function refreshSession(): Promise<string> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const attempt = (async (): Promise<string> => {
    const response = await fetch(apiUrl("/api/v1/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      accessToken = null;
      const body: unknown = await response.json().catch(() => null);
      const record = (body ?? {}) as { error?: unknown; message?: unknown };
      notifySessionExpired();
      throw new ApiError(
        typeof record.error === "string" ? record.error : "refresh_failed",
        typeof record.message === "string" ? record.message : "The session could not be refreshed",
        response.status,
      );
    }

    const payload = unwrapEnvelope(await response.json().catch(() => null)) as SessionPayload;
    if (typeof payload.access_token !== "string" || payload.access_token === "") {
      accessToken = null;
      notifySessionExpired();
      throw new ApiError(
        "invalid_response",
        "The refresh response carried no access token",
        502,
      );
    }

    accessToken = payload.access_token;
    return accessToken;
  })();

  // Cleared on settle, success or failure, so a later refresh is not blocked and
  // a failure does not leave a rejected promise cached forever. The derived
  // promise is swallowed here because callers await `attempt`, not this one: an
  // unobserved rejection would surface as an unhandled-rejection crash.
  refreshInFlight = attempt.finally(() => {
    refreshInFlight = null;
  });
  refreshInFlight.catch(() => undefined);

  return attempt;
}

/**
 * Fetch a versioned API path with the session attached.
 *
 * On a 401 it refreshes once and replays the request once. The retry is
 * deliberately capped: an endpoint that always answers 401 must not become an
 * infinite refresh loop.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (!headers.has("accept")) {
      headers.set("accept", "application/json");
    }
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const request: RequestInit = {
      ...init,
      headers,
      // Overrides any caller value: without the cookie the refresh path cannot work.
      credentials: "include",
    };

    // A FormData body must keep the browser-generated Content-Type, because that is
    // where the multipart boundary lives. Setting it by hand produces a 422 from
    // FastAPI that reads as a validation bug rather than a header bug.
    if (typeof FormData !== "undefined" && init.body instanceof FormData) {
      headers.delete("content-type");
    }

    return fetch(apiUrl(path), request);
  };

  const response = await send(accessToken);
  if (response.status !== 401) {
    return response;
  }

  const token = await refreshSession();
  return send(token);
}
