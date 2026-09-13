import { readJson } from "lib/api/client";
import { unwrapEnvelope } from "lib/api/envelope";
import { authFetch } from "lib/auth/session";

import type { OrderFilters } from "./schemas";
import type { OrderListResponse } from "./types";
import { listParamsFromFilters } from "./mapping";

/**
 * Transport calls owned by the orders module.
 *
 * The backend has no order entity yet, so this wrapper calls the documented
 * versioned path and lets the contract's own response surface. The body is unwrapped
 * through the same helper every other module uses, so the shape is right the day the
 * endpoint exists. No order rows are invented to fill the table.
 */
export async function fetchOrders(filters: OrderFilters): Promise<OrderListResponse> {
  const query = listParamsFromFilters(filters);
  const response = await authFetch(`/api/v1/orders?${query}`);
  return unwrapEnvelope(await readJson(response)) as OrderListResponse;
}
