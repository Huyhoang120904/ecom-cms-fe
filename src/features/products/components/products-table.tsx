import Link from "next/link";
import { Edit2, Eye, Package } from "react-feather";

import EmptyState from "widgets/empty-state";
import type { DataTableColumn } from "widgets/data-table";

import { formatDate } from "features/products/mapping";
import type { ProductStatus, ProductSummary } from "features/products/types";

/** The three statuses the contract has, each with its own tone and dot. */
export function ProductStatusBadge({ status }: { status: ProductStatus | string }) {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return (
      <span className="badge-status badge-status-success">
        <span className="badge-dot bg-success" />
        Active
      </span>
    );
  }

  if (normalized === "inactive") {
    return (
      <span className="badge-status badge-status-secondary">
        <span className="badge-dot bg-secondary" />
        Inactive
      </span>
    );
  }

  return (
    <span className="badge-status badge-status-warning">
      <span className="badge-dot bg-warning" />
      Draft
    </span>
  );
}

/**
 * The empty state for a shop that has not created a product yet.
 *
 * It says the list is empty because it is empty. A product starts as a draft, so the copy
 * also says what happens next rather than implying the page failed.
 */
export function ProductsEmptyState({ canWrite }: { canWrite: boolean }) {
  return (
    <EmptyState
      icon={<Package size={24} />}
      title="No products yet"
      body="This shop has no products. A new product starts as a draft, so nothing is visible to buyers until you publish it."
      action={canWrite ? { label: "Add your first product", href: "/products/new" } : undefined}
    >
      {canWrite ? null : (
        <p className="text-muted small mb-0">
          Your role can read this shop&apos;s products but not create them.
        </p>
      )}
    </EmptyState>
  );
}

interface ProductColumnContext {
  /** Resolved from the cached catalog; a raw id is never shown to a seller. */
  categoryNames: Map<string, string>;
  brandNames: Map<string, string>;
  canWrite: boolean;
}

/**
 * Column definitions for the product list.
 *
 * Every column is a fact the list endpoint returns. There is deliberately no price or
 * stock column: both belong to a variant, and the list payload carries neither, so showing
 * them here would mean inventing a number. The product's own page has them.
 */
export function productColumns({
  categoryNames,
  brandNames,
  canWrite,
}: ProductColumnContext): DataTableColumn<ProductSummary>[] {
  return [
    {
      id: "product",
      header: "Product",
      width: "34%",
      skeletonWidth: 160,
      render: (product) => (
        <>
          <Link
            href={`/products/${product.id}`}
            className="fw-semibold text-dark d-block text-decoration-none"
          >
            {product.name}
          </Link>
          <span className="text-muted small">Added {formatDate(product.created_at)}</span>
        </>
      ),
    },
    {
      id: "category",
      header: "Category",
      skeletonWidth: 80,
      render: (product) => (
        <span className="text-secondary small">{categoryNames.get(product.category_id) ?? "—"}</span>
      ),
    },
    {
      id: "brand",
      header: "Brand",
      skeletonWidth: 64,
      render: (product) => (
        <span className="text-secondary small">
          {product.brand_id ? (brandNames.get(product.brand_id) ?? "—") : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      skeletonWidth: 72,
      render: (product) => <ProductStatusBadge status={product.status} />,
    },
    {
      id: "updated",
      header: "Updated",
      skeletonWidth: 84,
      render: (product) => <span className="text-muted small">{formatDate(product.updated_at)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      skeletonWidth: 60,
      render: (product) => (
        <div className="d-inline-flex gap-1">
          <Link
            href={`/products/${product.id}`}
            className="table-action-btn"
            aria-label={`View ${product.name}`}
          >
            <Eye size={15} />
          </Link>
          {canWrite ? (
            <Link
              href={`/products/${product.id}/edit`}
              className="table-action-btn"
              aria-label={`Edit ${product.name}`}
            >
              <Edit2 size={15} />
            </Link>
          ) : null}
        </div>
      ),
    },
  ];
}
