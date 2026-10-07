/**
 * Transport calls owned by the catalog module.
 *
 * The catalog is shared platform configuration, read by any signed-in seller because a
 * product form is built from it. Every route here is a `GET`; writes belong to platform
 * administration, which this repository does not present.
 */

import { readJson } from "lib/api/client";
import { parseEnvelope } from "lib/api/envelope";
import { authFetch } from "lib/auth/session";

import { brandListSchema, categoryAttributeListSchema, categoryTreeSchema } from "./schemas";
import type { Brand, CategoryAttribute, CategoryTreeNode } from "./types";

/** The whole category tree, in the backend's own order. */
export async function fetchCategoryTree(): Promise<CategoryTreeNode[]> {
  const response = await authFetch("/api/v1/catalog/categories");
  return parseEnvelope(categoryTreeSchema, await readJson(response));
}

/** The attributes a category asks for — the metadata a product form is built from. */
export async function fetchCategoryAttributes(
  categoryId: string,
): Promise<CategoryAttribute[]> {
  const response = await authFetch(
    `/api/v1/catalog/categories/${encodeURIComponent(categoryId)}/attributes`,
  );
  return parseEnvelope(categoryAttributeListSchema, await readJson(response));
}

/** Every brand, unpaginated: the list endpoint returns them all. */
export async function fetchBrands(): Promise<Brand[]> {
  const response = await authFetch("/api/v1/catalog/brands");
  return parseEnvelope(brandListSchema, await readJson(response));
}
