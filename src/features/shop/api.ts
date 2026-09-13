/**
 * Transport calls owned by the shop module.
 *
 * The backend exposes shop settings only for the *active* shop, read from the
 * session's scoping, so every path here is `/shops/active`. Switching which shop is
 * active is an identity concern and lives in the auth module.
 */

import { apiUrl, assertOk, readJson } from "lib/api/client";
import { unwrapEnvelope } from "lib/api/envelope";
import { authFetch } from "lib/auth/session";

import type { Shop, ShopUpdatePayload, DeleteShopPayload } from "features/auth/types";

export async function updateShop(payload: ShopUpdatePayload): Promise<Shop> {
  const response = await authFetch("/api/v1/shops/active", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return unwrapEnvelope(await readJson(response)) as Shop;
}

/**
 * Upload the shop background.
 *
 * The `Content-Type` is left for the browser: only it knows the multipart boundary
 * it generated, and setting the header by hand produces a 422 from FastAPI that
 * reads as a validation bug.
 */
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

export { apiUrl };
