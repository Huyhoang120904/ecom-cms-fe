import { useQuery } from "@tanstack/react-query";

import { isRetriable } from "lib/query/retry";

import { fetchOrders } from "./api";
import { ordersKeys } from "./query-keys";

import type { OrderFilters } from "./schemas";

/** List query for the orders module. */
export function useOrdersQuery(filters: OrderFilters) {
  return useQuery({
    queryKey: ordersKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    // The endpoint is not published yet, so a missing contract is a real state
    // rather than a transient failure worth retrying.
    retry: isRetriable,
  });
}
