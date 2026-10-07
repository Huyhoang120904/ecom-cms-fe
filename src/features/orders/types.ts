/**
 * Domain types for the orders module.
 *
 * The backend has no persisted order entity yet, so there is no transport shape
 * to mirror. `lib/api/generated.ts` becomes the source of the wire shape once
 * `GET /api/v1/openapi.json` publishes an order schema.
 */

/** A single order row as published by the orders endpoint. */
export interface OrderListItem {
  id: string;
  reference?: string;
  customer?: string;
  itemsCount?: number;
  total?: number | string;
  status?: string;
  placedAt?: string;
}

/** Paginated envelope returned by the orders endpoint. */
export interface OrderListResponse {
  items: OrderListItem[];
  total?: number;
}
