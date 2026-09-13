import type { OrderFilters } from "./schemas";

/**
 * Query keys for the orders module.
 *
 * The list key embeds the validated filter object so paginated views cache
 * separately.
 */
export const ordersKeys = {
  all: ["orders"] as const,
  list: (filters: OrderFilters) => [...ordersKeys.all, "list", filters] as const,
};
