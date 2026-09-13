import { useRouter } from "next/router";
import { Card, Table } from "react-bootstrap";

import PageHeading from "widgets/page-heading";

import ProductFilters from "features/products/components/product-filters";
import ProductsTableSkeleton, {
  ProductsEmptyState,
} from "features/products/components/products-table";
import { useProductsQuery } from "features/products/queries";
import { parseProductFilters } from "features/products/schemas";

/**
 * Products page.
 *
 * Filters and pagination are URL-backed. The list renders loading, error, and
 * empty states only — no placeholder rows and no invented totals.
 */
export default function ProductsPage() {
  const router = useRouter();
  const filters = parseProductFilters(router.query);
  const products = useProductsQuery(filters);
  const rows = products.data?.items ?? [];

  return (
    <div className="container-fluid p-6">
      <PageHeading heading="Products" />

      <Card className="border-0 shadow-sm">
        <ProductFilters />

        <Card.Body className="px-0 py-0">
          {products.isPending ? <ProductsTableSkeleton /> : null}

          {products.isError ? (
            <p className="text-danger px-4 py-4 mb-0">
              The catalogue endpoint is not available. Start ecom-be with the
              products module enabled, then reload.
            </p>
          ) : null}

          {products.isSuccess && rows.length === 0 ? (
            <ProductsEmptyState />
          ) : null}

          {rows.length > 0 ? (
            <Table responsive className="align-middle mb-0">
              <caption className="px-4">
                Page {filters.page}, {filters.pageSize} rows per page.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="fw-normal">
                      {row.name}
                    </th>
                    <td>{row.status ?? "unknown"}</td>
                    <td>{row.updatedAt ?? "unknown"}</td>
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
