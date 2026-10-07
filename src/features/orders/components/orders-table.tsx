import { ChevronDown, ChevronUp, ChevronsDown, Eye, ShoppingBag } from "react-feather";

import EmptyState from "widgets/empty-state";
import type { DataTableColumn } from "widgets/data-table";

import type { MockOrder } from "features/orders/mock-data";

export type OrderSortKey = "reference" | "customer" | "total" | "status" | "placedAt";
export type SortDirection = "asc" | "desc";

export interface OrderSort {
  key: OrderSortKey;
  direction: SortDirection;
}

/** Semantic status badge for orders. */
export function OrderStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? "unknown").toLowerCase();

  switch (normalized) {
    case "completed":
    case "delivered":
    case "paid":
      return (
        <span className="badge-status badge-status-success">
          <span className="badge-dot bg-success" />
          Completed
        </span>
      );
    case "processing":
    case "confirmed":
    case "shipped":
      return (
        <span className="badge-status badge-status-info">
          <span className="badge-dot bg-info" />
          Processing
        </span>
      );
    case "pending":
    case "pending_payment":
      return (
        <span className="badge-status badge-status-warning">
          <span className="badge-dot bg-warning" />
          Pending
        </span>
      );
    case "cancelled":
    case "failed":
    case "refunded":
      return (
        <span className="badge-status badge-status-danger">
          <span className="badge-dot bg-danger" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="badge-status badge-status-secondary">
          <span className="badge-dot bg-secondary" />
          {status ?? "Unknown"}
        </span>
      );
  }
}

/** Honest empty state: no rows are fabricated when the list has no data. */
export function OrdersEmptyState() {
  return (
    <EmptyState
      icon={<ShoppingBag size={24} />}
      title="No orders yet"
      body="The orders module has not published an endpoint, so there is nothing to list."
    />
  );
}

/** Sort control that lives inside a column header so sorting stays feature-owned. */
function SortButton({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: OrderSortKey;
  sort: OrderSort;
  onSort: (column: OrderSortKey) => void;
}) {
  const active = sort.key === column;
  const Icon = active ? (sort.direction === "asc" ? ChevronUp : ChevronDown) : ChevronsDown;

  return (
    <button
      type="button"
      className="table-sort-btn"
      aria-label={`Sort orders by ${label}`}
      aria-pressed={active}
      onClick={() => onSort(column)}
    >
      <span>{label}</span>
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

function formatPrice(total?: number | string): string {
  if (total === undefined || total === null || total === "") return "-";
  const num = typeof total === "number" ? total : Number(total);
  return Number.isNaN(num) ? String(total) : `$${num.toFixed(2)}`;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function getInitials(name?: string): string {
  if (!name) return "C";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase()
    : parts[0]!.slice(0, 2).toUpperCase();
}

/** Column definitions for the sample order list. */
export function orderColumns({
  sort,
  onSort,
  onView,
}: {
  sort: OrderSort;
  onSort: (column: OrderSortKey) => void;
  onView: (order: MockOrder) => void;
}): DataTableColumn<MockOrder>[] {
  return [
    {
      id: "reference",
      header: <SortButton label="Order" column="reference" sort={sort} onSort={onSort} />,
      width: "24%",
      skeletonWidth: 110,
      render: (order) => (
        <>
          <span className="fw-semibold text-primary d-block">{order.reference}</span>
          <span className="text-muted small">ID: {order.id}</span>
        </>
      ),
    },
    {
      id: "customer",
      header: <SortButton label="Customer" column="customer" sort={sort} onSort={onSort} />,
      width: "24%",
      skeletonWidth: 100,
      render: (order) => (
        <div className="d-flex align-items-center">
          <div className="customer-avatar me-2" aria-hidden="true">
            {getInitials(order.customer)}
          </div>
          <span className="text-dark fw-medium">{order.customer}</span>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      skeletonWidth: 45,
      render: (order) => (
        <span className="text-secondary small">
          {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      id: "total",
      header: <SortButton label="Total" column="total" sort={sort} onSort={onSort} />,
      skeletonWidth: 65,
      render: (order) => <span className="fw-semibold text-dark">{formatPrice(order.total)}</span>,
    },
    {
      id: "status",
      header: "Status",
      skeletonWidth: 76,
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: "placed",
      header: <SortButton label="Placed" column="placedAt" sort={sort} onSort={onSort} />,
      skeletonWidth: 90,
      render: (order) => <span className="text-muted small">{formatDate(order.placedAt)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      skeletonWidth: 28,
      render: (order) => (
        <button
          type="button"
          className="table-action-btn"
          title="View order"
          aria-label={`View order ${order.reference}`}
          onClick={() => onView(order)}
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];
}
