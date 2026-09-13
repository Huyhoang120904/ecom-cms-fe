import type { ProductFilters } from "./schemas";

/**
 * Query keys for the products module.
 *
 * The list key embeds the validated filter object so paginated views cache
 * separately.
 */
export const productsKeys = {
  all: ["products"] as const,
  list: (filters: ProductFilters) =>
    [...productsKeys.all, "list", filters] as const,
};
