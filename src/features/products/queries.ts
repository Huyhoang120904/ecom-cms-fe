import { useQuery } from "@tanstack/react-query";

import { fetchProducts } from "./api";
import { productsKeys } from "./query-keys";

import type { ProductFilters } from "./schemas";

/** List query for the products module. */
export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: productsKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    // The endpoint is not published yet, so a missing contract is a real
    // state rather than a transient failure worth retrying.
    retry: false,
  });
}
