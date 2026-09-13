import { unwrapEnvelope } from "lib/api/envelope";
import { readJson } from "lib/api/client";
import { authFetch } from "lib/auth/session";

import type { ProductFilters } from "./schemas";
import type { ProductListResponse } from "./types";
import { listParamsFromFilters } from "./mapping";

/**
 * Transport calls owned by the products module.
 *
 * The backend has no product entity yet, so this wrapper calls the documented
 * versioned path and lets the contract's own response surface. Now that the backend
 * publishes the envelope, the body is unwrapped and the module's schema asserts the
 * `{ items, page, pageSize }` shape, so the day the endpoint exists the read is
 * already correct. No catalogue is invented to fill the table.
 */
export async function fetchProducts(filters: ProductFilters): Promise<ProductListResponse> {
  const query = listParamsFromFilters(filters);
  const response = await authFetch(`/api/v1/products?${query}`);
  return unwrapEnvelope(await readJson(response)) as ProductListResponse;
}
