import { queryOptions, useQuery } from "@tanstack/react-query";

import { isRetriable } from "lib/query/retry";

import { fetchBrands, fetchCategoryAttributes, fetchCategoryTree } from "./api";

/**
 * Query keys for the catalog module.
 *
 * The keys live beside the `queryOptions` factories that use them, so a key and its
 * hook cannot drift apart.
 */
export const catalogKeys = {
  all: ["catalog"] as const,
  tree: () => [...catalogKeys.all, "categories"] as const,
  attributes: (categoryId: string) =>
    [...catalogKeys.all, "categories", categoryId, "attributes"] as const,
  brands: () => [...catalogKeys.all, "brands"] as const,
};

/**
 * The catalog is platform configuration: an admin changes it rarely, and a seller's
 * form metadata does not need to be fresher than the tab they are working in.
 */
const CATALOG_STALE_TIME = 5 * 60_000;

export function categoryTreeOptions() {
  return queryOptions({
    queryKey: catalogKeys.tree(),
    queryFn: fetchCategoryTree,
    staleTime: CATALOG_STALE_TIME,
    retry: isRetriable,
  });
}

/**
 * A category's attribute configuration.
 *
 * Disabled until a category is chosen: there is no "all attributes" endpoint, and a
 * request without an id would be a 404 dressed up as a loading state.
 */
export function categoryAttributesOptions(categoryId: string | null) {
  return queryOptions({
    queryKey: catalogKeys.attributes(categoryId ?? ""),
    queryFn: () => fetchCategoryAttributes(categoryId as string),
    enabled: categoryId !== null,
    staleTime: CATALOG_STALE_TIME,
    retry: isRetriable,
  });
}

export function brandsOptions() {
  return queryOptions({
    queryKey: catalogKeys.brands(),
    queryFn: fetchBrands,
    staleTime: CATALOG_STALE_TIME,
    retry: isRetriable,
  });
}

export function useCategoryTreeQuery() {
  return useQuery(categoryTreeOptions());
}

export function useCategoryAttributesQuery(categoryId: string | null) {
  return useQuery(categoryAttributesOptions(categoryId));
}

export function useBrandsQuery() {
  return useQuery(brandsOptions());
}
