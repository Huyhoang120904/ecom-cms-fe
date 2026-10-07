/**
 * Transport calls owned by the products module.
 *
 * Every path the module uses appears here and nowhere else. The shop is taken from the
 * session's token, so no call carries a `shop_id`; a product of another shop answers `404`
 * rather than `403`, which is deliberate on the backend's side (it does not disclose that
 * the id exists).
 *
 * Responses are parsed through the module's own schemas: the wire types are hand-written,
 * so the parse is the only thing standing between a renamed field and an `undefined`
 * rendered three components down.
 */

import { apiUrl, assertOk, readJson } from "lib/api/client";
import { parseEnvelope } from "lib/api/envelope";
import { authFetch } from "lib/auth/session";

import { listParamsFromFilters } from "./mapping";
import {
  productImageListSchema,
  productImageSchema,
  productPageSchema,
  productSchema,
  variantListSchema,
  variantSchema,
} from "./schemas";
import type { ProductFilters } from "./schemas";
import type {
  Product,
  ProductCreatePayload,
  ProductImage,
  ProductPage,
  ProductUpdatePayload,
  Variant,
  VariantCreatePayload,
  VariantUpdatePayload,
} from "./types";

const JSON_HEADERS = { "content-type": "application/json" } as const;

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export async function fetchProducts(filters: ProductFilters): Promise<ProductPage> {
  const query = listParamsFromFilters(filters);
  const response = await authFetch(`/api/v1/products?${query}`);
  return parseEnvelope(productPageSchema, await readJson(response));
}

export async function fetchProduct(productId: string): Promise<Product> {
  const response = await authFetch(`/api/v1/products/${encodeURIComponent(productId)}`);
  return parseEnvelope(productSchema, await readJson(response));
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const response = await authFetch("/api/v1/products", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return parseEnvelope(productSchema, await readJson(response));
}

export async function updateProduct(
  productId: string,
  payload: ProductUpdatePayload,
): Promise<Product> {
  const response = await authFetch(`/api/v1/products/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  return parseEnvelope(productSchema, await readJson(response));
}

/** Soft delete. There is no restore endpoint in this phase. */
export async function deleteProduct(productId: string): Promise<void> {
  await assertOk(
    await authFetch(`/api/v1/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
  );
}

/**
 * Move a product to `active`.
 *
 * The backend refuses unless the required attributes are present and at least one variant
 * is active; that refusal arrives as `422 product_invariant_violated` carrying the missing
 * attributes in `details`, which is what a form marks.
 */
export async function publishProduct(productId: string): Promise<Product> {
  const response = await authFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/publish`,
    { method: "POST" },
  );
  return parseEnvelope(productSchema, await readJson(response));
}

export async function unpublishProduct(productId: string): Promise<Product> {
  const response = await authFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/unpublish`,
    { method: "POST" },
  );
  return parseEnvelope(productSchema, await readJson(response));
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export async function fetchVariants(productId: string): Promise<Variant[]> {
  const response = await authFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/variants`,
  );
  return parseEnvelope(variantListSchema, await readJson(response));
}

export async function createVariant(
  productId: string,
  payload: VariantCreatePayload,
): Promise<Variant> {
  const response = await authFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/variants`,
    { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) },
  );
  return parseEnvelope(variantSchema, await readJson(response));
}

/** A partial update. `options` is not accepted: change a combination by recreating it. */
export async function updateVariant(
  productId: string,
  variantId: string,
  payload: VariantUpdatePayload,
): Promise<Variant> {
  const response = await authFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
    { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(payload) },
  );
  return parseEnvelope(variantSchema, await readJson(response));
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await assertOk(
    await authFetch(
      `/api/v1/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      { method: "DELETE" },
    ),
  );
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Upload an image, for the product itself or for one of its variants.
 *
 * The `Content-Type` is left to the browser: only it knows the multipart boundary it
 * generated, and setting the header by hand produces a `422` from FastAPI that reads as a
 * validation bug.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  variantId?: string,
): Promise<ProductImage> {
  const form = new FormData();
  form.append("file", file);
  if (variantId) form.append("variant_id", variantId);
  const response = await authFetch(`/api/v1/products/${encodeURIComponent(productId)}/images`, {
    method: "POST",
    body: form,
  });
  return parseEnvelope(productImageSchema, await readJson(response));
}

/**
 * Move an image to `position` within its own scope.
 *
 * The response is the whole reordered scope, which is exactly what a gallery should
 * render, so it is written straight into the cache instead of triggering a refetch.
 */
export async function moveProductImage(
  productId: string,
  imageId: string,
  position: number,
): Promise<ProductImage[]> {
  const response = await authFetch(
    `/api/v1/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ position }) },
  );
  return parseEnvelope(productImageListSchema, await readJson(response));
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await assertOk(
    await authFetch(
      `/api/v1/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
      { method: "DELETE" },
    ),
  );
}

export { apiUrl };