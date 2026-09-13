import { apiUrl, readJson } from "lib/api/client";

import type { OrderFilters } from "./schemas";
import type { OrderListResponse } from "./types";
import { listParamsFromFilters } from "./mapping";

/**
 * Transport calls owned by the orders module.
 *
 * The backend has no order entity yet, so this wrapper calls the documented
 * versioned path and lets the contract's own response surface. No order rows
 * are invented to fill the table.
 */
export async function fetchOrders(
  filters: OrderFilters,
): Promise<OrderListResponse> {
  const query = listParamsFromFilters(filters);
  const response = await fetch(apiUrl(`/api/v1/orders?${query}`), {
    headers: { accept: "application/json" },
  });
  return readJson<OrderListResponse>(response);
}
