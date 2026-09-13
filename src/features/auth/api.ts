/**
 * Transport calls owned by the auth module.
 *
 * Every call goes through `authFetch` so the bearer token is attached and a 401 is
 * recovered once, in one place. Sign-in and registration use a plain `fetch`: they
 * are the calls that *create* a session, so retrying them through the refresh path
 * would be circular.
 */

import { apiUrl, assertOk, readJson } from "lib/api/client";
import { unwrapEnvelope } from "lib/api/envelope";
import { authFetch, clearSession, setAccessToken } from "lib/auth/session";

import type {
  DeactivatePayload,
  DeleteShopPayload,
  LoginPayload,
  Me,
  ProfileUpdatePayload,
  RegisterPayload,
  Session,
  Shop,
  ShopUpdatePayload,
  SwitchShopPayload,
} from "./types";

async function readSession(response: Response): Promise<Session> {
  const session = unwrapEnvelope(await readJson(response)) as Session;
  // Store immediately: the caller may render before it resolves anything else.
  setAccessToken(session.access_token);
  return session;
}

/**
 * Create an account and its first shop.
 *
 * The response is a full session, so registering signs the seller in.
 */
export async function register(payload: RegisterPayload): Promise<Session> {
  const response = await fetch(apiUrl("/api/v1/auth/register"), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return readSession(response);
}

/** Sign in. The refresh cookie is set by the response, not by this function. */
export async function login(payload: LoginPayload): Promise<Session> {
  const response = await fetch(apiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return readSession(response);
}

/**
 * End the session.
 *
 * Local state is always cleared, even when the request fails, because the
 * alternative is telling a seller they are still signed in when their token is gone
 * from memory. A failed call is not rethrown: the seller asked to sign out of this
 * browser and they have. The one residual risk is that the server-side refresh
 * cookie was not revoked, which only matters if it was already captured; the access
 * token in memory is discarded either way and expires within its 15 minutes.
 */
export async function logout(): Promise<void> {
  try {
    await authFetch("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // Intentionally swallowed; see the note above.
  } finally {
    clearSession();
  }
}

/** The caller's identity and the shop the token is scoped to. */
export async function fetchMe(): Promise<Me> {
  const response = await authFetch("/api/v1/auth/me");
  return unwrapEnvelope(await readJson(response)) as Me;
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<Me> {
  const response = await authFetch("/api/v1/auth/me", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return unwrapEnvelope(await readJson(response)) as Me;
}

/**
 * Upload an avatar.
 *
 * The `Content-Type` is left for the browser to set, because only it knows the
 * multipart boundary it generated.
 */
export async function uploadAvatar(file: File): Promise<Me> {
  const form = new FormData();
  form.append("file", file);
  const response = await authFetch("/api/v1/auth/me/avatar", { method: "POST", body: form });
  return unwrapEnvelope(await readJson(response)) as Me;
}

export async function deleteAvatar(): Promise<void> {
  await assertOk(await authFetch("/api/v1/auth/me/avatar", { method: "DELETE" }));
}

/**
 * Re-scope the session to another shop.
 *
 * Rotates the access token and the refresh cookie, so the returned session must
 * replace the one in memory.
 */
export async function switchShop(payload: SwitchShopPayload): Promise<Session> {
  const response = await authFetch("/api/v1/auth/switch-shop", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readSession(response);
}

export async function updateShop(payload: ShopUpdatePayload): Promise<Shop> {
  const response = await authFetch("/api/v1/shops/active", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return unwrapEnvelope(await readJson(response)) as Shop;
}

export async function uploadShopBackground(file: File): Promise<Shop> {
  const form = new FormData();
  form.append("file", file);
  const response = await authFetch("/api/v1/shops/active/background", {
    method: "POST",
    body: form,
  });
  return unwrapEnvelope(await readJson(response)) as Shop;
}

export async function deleteShopBackground(): Promise<void> {
  await assertOk(await authFetch("/api/v1/shops/active/background", { method: "DELETE" }));
}

/** Retire the active shop. The backend compares the typed name against its own. */
export async function deleteShop(payload: DeleteShopPayload): Promise<void> {
  await assertOk(
    await authFetch("/api/v1/shops/active", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

/**
 * Deactivate the account. One-way, so there is no counterpart to this function.
 *
 * Clears local state only after the backend accepted it: the seller must not appear
 * signed out because a request failed.
 */
export async function deactivateAccount(payload: DeactivatePayload): Promise<void> {
  // The status check must come before clearSession: a rejected deactivation has to
  // leave the seller signed in to a live account.
  await assertOk(
    await authFetch("/api/v1/auth/deactivate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  clearSession();
}
