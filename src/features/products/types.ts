/**
 * Domain types for the products module.
 *
 * The backend has no persisted product entity yet, so there is no transport
 * shape to mirror. `lib/api/generated.ts` becomes the source of the wire shape
 * once `GET /api/v1/openapi.json` publishes a product schema.
 */

/** A single product row as published by the catalogue endpoint. */
export interface ProductListItem {
  id: string;
  name: string;
  status?: string;
  updatedAt?: string;
}

/** Paginated envelope returned by the catalogue endpoint. */
export interface ProductListResponse {
  items: ProductListItem[];
  total?: number;
}
