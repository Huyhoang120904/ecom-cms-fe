"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Col, Row } from "react-bootstrap";
import { Check, EyeOff, Plus } from "react-feather";

import BulkBar from "widgets/bulk-bar";
import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import SegmentedControl from "widgets/segmented-control";
import StatCard from "widgets/stat-card";

import { ApiError } from "lib/api/client";

import { useAuth } from "features/auth/auth-context";
import { categoryNameMap, useBrandsQuery, useCategoryTreeQuery } from "features/catalog";
import { ProductsEmptyState, productColumns } from "features/products/components/products-table";
import { PRODUCT_STATUSES } from "features/products/constants";
import { productStatusLabel } from "features/products/mapping";
import { useBulkProductStatusMutation, type BulkStatusAction } from "features/products/mutations";
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

  const listKey = `${filters.status ?? ""}|${filters.page}|${filters.pageSize}`;
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkReport, setBulkReport] = useState<{
    action: BulkStatusAction;
    succeeded: number;
    failures: { id: string; name: string; message: string }[];
  } | null>(null);

  // Resetting transient selection state when the server list identity changes is the
  // one case for a sync setState in an effect: there is no external system to subscribe to.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- transient selection resets with the list identity
    setSelected([]);
    setBulkReport(null);
  }, [listKey]);

  const bulk = useBulkProductStatusMutation();
  const names = new Map((page?.items ?? []).map((product) => [product.id, product.name]));

  async function runBulk(action: BulkStatusAction, ids: string[]) {
    setBulkReport(null);
    const results = await bulk.mutateAsync({ ids, action });
    const failures = results.filter((result) => !result.ok);
    if (failures.length === 0) setSelected([]);
    else setSelected(failures.map((failure) => failure.id));
    setBulkReport({
      action,
      succeeded: results.length - failures.length,
      failures: failures.map((failure) => ({
        id: failure.id,
        name: names.get(failure.id) ?? failure.id,
        message: failure.message ?? "The product could not be updated.",
      })),
    });
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
          <SegmentedControl
            label="Filter by status"
            name="product-status"
            options={[
              { value: "", label: "All" },
              ...PRODUCT_STATUSES.map((value) => ({ value, label: productStatusLabel(value) })),
            ]}
            value={filters.status ?? ""}
            onChange={(next) => updateQuery({ status: next || undefined, page: "1" })}
          />
        </FilterBar>

        <Card.Body className="px-0 py-0">
          {bulkReport && bulkReport.failures.length > 0 ? (
            <div className="px-4 py-3 border-bottom" role="alert">
              <p className="mb-1 fw-semibold text-danger">
                {bulkReport.action === "publish" ? "Published" : "Unpublished"}{" "}
                {bulkReport.succeeded} of {bulkReport.succeeded + bulkReport.failures.length} —{" "}
                {bulkReport.failures.length} failed:
              </p>
              <ul className="mb-2 small">
                {bulkReport.failures.map((failure) => (
                  <li key={failure.id}>
                    {failure.name} — {failure.message}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={bulk.isPending}
                onClick={() =>
                  void runBulk(
                    bulkReport.action,
                    bulkReport.failures.map((failure) => failure.id),
                  )
                }
              >
                Retry failed
              </Button>
            </div>
          ) : null}
          {canWrite && selected.length > 0 ? (
            <BulkBar
              countLabel={`${selected.length} ${selected.length === 1 ? "product" : "products"} selected`}
              actions={[
                {
                  id: "publish",
                  label: "Publish",
                  icon: <Check size={14} aria-hidden="true" />,
                  variant: "primary",
                },
                {
                  id: "unpublish",
                  label: "Unpublish",
                  icon: <EyeOff size={14} aria-hidden="true" />,
                },
              ]}
              onAction={(id) => void runBulk(id as BulkStatusAction, selected)}
              onClear={() => setSelected([])}
              isPending={bulk.isPending}
            />
          ) : null}
          <DataTable
            columns={productColumns({ categoryNames, brandNames, canWrite })}
            rows={page?.items ?? []}
            getRowKey={(product) => product.id}
            isLoading={products.isPending}
            errorMessage={errorMessage}
            onRetry={() => void products.refetch()}
            emptyState={<ProductsEmptyState canWrite={canWrite} />}
            selectedKeys={canWrite ? selected : undefined}
            onSelectionChange={canWrite ? setSelected : undefined}
          />
          {!products.isError && page && page.items.length > 0 ? (
            <Pagination
              page={page.page}
              pageSize={page.page_size}
              total={page.total}
              onPage={goToPage}
              itemLabel="products"
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={(size) => updateQuery({ pageSize: String(size), page: "1" })}
            />
          ) : null}
        </Card.Body>
      </Card>
    </PageShell>
  );
}
