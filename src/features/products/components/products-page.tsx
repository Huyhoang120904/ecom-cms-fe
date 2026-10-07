"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, Col, Form, Row } from "react-bootstrap";
import { Plus } from "react-feather";

import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import StatCard from "widgets/stat-card";

import { ApiError } from "lib/api/client";

import { useAuth } from "features/auth/auth-context";
import { categoryNameMap, useBrandsQuery, useCategoryTreeQuery } from "features/catalog";
import { ProductsEmptyState, productColumns } from "features/products/components/products-table";
import { PRODUCT_STATUSES } from "features/products/constants";
import { productStatusLabel } from "features/products/mapping";
import { parseProductFilters } from "features/products/schemas";
import { useProductsQuery } from "features/products/queries";

/**
 * The seller's products.
 *
 * Listing state lives in the URL, so a filtered view is a link a seller can send. The
 * query is server-side: `status`, `page`, and `page_size` are the only things the endpoint
 * accepts, and the page shows the contract's own `total` rather than counting the rows it
 * happens to hold.
 */
export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // `useSearchParams` is typed nullable: during a static prerender there is no query
  // string. An empty params object keeps the page renderable instead of throwing, and the
  // parsers below already normalize whatever they are given.
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const { can } = useAuth();

  const filters = parseProductFilters(Object.fromEntries(searchParams.entries()));
  const products = useProductsQuery(filters);

  // Catalog metadata is cached and read-only: resolving ids to names here keeps raw
  // identifiers out of the table.
  const tree = useCategoryTreeQuery();
  const brands = useBrandsQuery();

  const categoryNames = categoryNameMap(tree.data ?? []);
  const brandNames = new Map((brands.data ?? []).map((brand) => [brand.id, brand.name]));

  const canWrite = can("products:write");
  const page = products.data;

  function updateQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToPage(pageNumber: number) {
    updateQuery({ page: String(pageNumber) });
  }

  const failure = products.error;
  const errorMessage = products.isError
    ? failure instanceof ApiError
      ? failure.message
      : "The product list could not be loaded."
    : undefined;

  return (
    <PageShell
      title="Products"
      actions={
        canWrite ? (
          <Link href="/products/new" className="btn btn-primary btn-sm d-inline-flex align-items-center">
            <Plus size={15} className="me-1" aria-hidden="true" />
            Add product
          </Link>
        ) : undefined
      }
      stats={
        <Row className="g-3">
          <Col xl={3} md={6}>
            <StatCard
              label="Total products"
              value={products.isPending ? "—" : (page?.total ?? "—")}
              hint={filters.status ? `Filtered to ${filters.status}` : "Every status"}
            />
          </Col>
        </Row>
      }
    >
      <Card className="shopee-card">
        <FilterBar
          onReset={
            filters.status
              ? () => updateQuery({ status: undefined, page: undefined })
              : undefined
          }
        >
          <div style={{ minWidth: 220 }}>
            <Form.Label htmlFor="product-status-filter" className="visually-hidden">
              Filter by status
            </Form.Label>
            <Form.Select
              id="product-status-filter"
              value={filters.status ?? ""}
              onChange={(event) =>
                updateQuery({ status: event.target.value || undefined, page: "1" })
              }
              aria-label="Filter products by status"
            >
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {productStatusLabel(value)}
                </option>
              ))}
            </Form.Select>
          </div>
        </FilterBar>

        <Card.Body className="px-0 py-0">
          <DataTable
            columns={productColumns({ categoryNames, brandNames, canWrite })}
            rows={page?.items ?? []}
            getRowKey={(product) => product.id}
            isLoading={products.isPending}
            errorMessage={errorMessage}
            onRetry={() => void products.refetch()}
            emptyState={<ProductsEmptyState canWrite={canWrite} />}
          />
          {!products.isError && page && page.items.length > 0 ? (
            <Pagination
              page={page.page}
              pageSize={page.page_size}
              total={page.total}
              onPage={goToPage}
              itemLabel="products"
            />
          ) : null}
        </Card.Body>
      </Card>
    </PageShell>
  );
}
