import { apiUrl, readJson } from "lib/api/client";

import type { ProductFilters } from "./schemas";
import type { ProductListResponse } from "./types";
import { listParamsFromFilters } from "./mapping";

/**
 * Transport calls owned by the products module.
 *
 * The backend has no product entity yet, so this wrapper calls the documented
 * versioned path and lets the contract's own response surface. No catalogue is
 * invented to fill the table.
 */
export async function fetchProducts(
  filters: ProductFilters,
): Promise<ProductListResponse> {
  const query = listParamsFromFilters(filters);
  const response = await fetch(apiUrl(`/api/v1/products?${query}`), {
    headers: { accept: "application/json" },
  });
  return readJson<ProductListResponse>(response);
}
