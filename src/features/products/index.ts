/**
 * Public exports of the products module.
 *
 * Routes import from this file, never from a deep path.
 */
export { default as ProductsPage } from "./components/products-page";
export { productsKeys } from "./query-keys";
export { useProductsQuery } from "./queries";
export { productFilterSchema, parseProductFilters } from "./schemas";
export type { ProductFilters } from "./schemas";
export type { ProductListItem, ProductListResponse } from "./types";
