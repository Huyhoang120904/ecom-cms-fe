/**
 * Mapping helpers for the orders module.
 *
 * Pure functions only: no I/O, no framework imports.
 */

import type { OrderFilters } from "./schemas";

/** Convert validated filters into request query parameters. */
export function listParamsFromFilters(filters: OrderFilters): string {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}
