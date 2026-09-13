import { useRouter } from "next/router";
import { Card, Table } from "react-bootstrap";

import PageHeading from "widgets/page-heading";

import OrderFilters from "features/orders/components/order-filters";
import OrdersTableSkeleton, {
  OrdersEmptyState,
} from "features/orders/components/orders-table";
import { useOrdersQuery } from "features/orders/queries";
import { parseOrderFilters } from "features/orders/schemas";

/**
 * Orders page.
 *
 * Filters and pagination are URL-backed. The list renders loading, error, and
 * empty states only — no placeholder rows and no invented totals.
 */
export default function OrdersPage() {
  const router = useRouter();
  const filters = parseOrderFilters(router.query);
  const orders = useOrdersQuery(filters);
  const rows = orders.data?.items ?? [];

  return (
    <div className="container-fluid p-6">
      <PageHeading heading="Orders" />

      <Card className="border-0 shadow-sm">
        <OrderFilters />

        <Card.Body className="px-0 py-0">
          {orders.isPending ? <OrdersTableSkeleton /> : null}

          {orders.isError ? (
            <p className="text-danger px-4 py-4 mb-0">
              The orders endpoint is not available. Start ecom-be with the
              orders module enabled, then reload.
            </p>
          ) : null}

          {orders.isSuccess && rows.length === 0 ? <OrdersEmptyState /> : null}

          {rows.length > 0 ? (
            <Table responsive className="align-middle mb-0">
              <caption className="px-4">
                Page {filters.page}, {filters.pageSize} rows per page.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Status</th>
                  <th scope="col">Placed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="fw-normal">
                      {row.reference ?? row.id}
                    </th>
                    <td>{row.status ?? "unknown"}</td>
                    <td>{row.placedAt ?? "unknown"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : null}
        </Card.Body>
      </Card>
    </div>
  );
}
