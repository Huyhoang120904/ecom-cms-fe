/**
 * Mapping helpers for the products module.
 *
 * Pure functions only: no I/O, no framework imports.
 */

import type { ProductFilters } from "./schemas";

/** Convert validated filters into request query parameters. */
export function listParamsFromFilters(filters: ProductFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}
