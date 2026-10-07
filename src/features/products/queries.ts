import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";

import { isRetriable } from "lib/query/retry";

import { fetchProduct, fetchProducts, fetchVariants } from "./api";
import type { ProductFilters } from "./schemas";

/**
 * Query keys for the products module.
 *
 * The keys live beside the `queryOptions` factories that consume them, so a key cannot
 * drift from the hook that reads it and an invalidation can be expressed with the
 * factory's own `queryKey` instead of a hand-typed tuple.
 */
export const productsKeys = {
  all: ["products"] as const,
  list: (filters: ProductFilters) => [...productsKeys.all, "list", filters] as const,
  detail: (productId: string) => [...productsKeys.all, "detail", productId] as const,
  variants: (productId: string) => [...productsKeys.all, "variants", productId] as const,
};

/**
 * The seller's product page.
 *
 * `placeholderData: keepPreviousData` keeps the current page on screen while the next one
 * loads, so paging does not blank the table or shift the layout under the cursor.
 */
export function productListOptions(filters: ProductFilters) {
  return queryOptions({
    queryKey: productsKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData,
    retry: isRetriable,
  });
}

/** One product, with its attributes, variants, and images. */
export function productDetailOptions(productId: string) {
  return queryOptions({
    queryKey: productsKeys.detail(productId),
    queryFn: () => fetchProduct(productId),
    retry: isRetriable,
  });
}

/**
 * A product's variants on their own.
 *
 * The detail payload already carries them; this exists for callers that need the variant
 * list without re-reading the product, and it is the key variant mutations invalidate
 * alongside the detail.
 */
export function productVariantsOptions(productId: string) {
  return queryOptions({
    queryKey: productsKeys.variants(productId),
    queryFn: () => fetchVariants(productId),
    retry: isRetriable,
  });
}

export function useProductsQuery(filters: ProductFilters) {
  return useQuery(productListOptions(filters));
}

export function useProductQuery(productId: string) {
  return useQuery(productDetailOptions(productId));
}

export function useProductVariantsQuery(productId: string) {
  return useQuery(productVariantsOptions(productId));
}