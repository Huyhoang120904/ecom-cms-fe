"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Col, Offcanvas, Row } from "react-bootstrap";
import { CheckCircle, Clock, Download, RefreshCw, ShoppingBag } from "react-feather";

import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import FilterChips from "widgets/filter-chips";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import SegmentedControl from "widgets/segmented-control";
import StatCard from "widgets/stat-card";

import { OrdersEmptyState, OrderStatusBadge, orderColumns, type OrderSort, type OrderSortKey, type SortDirection } from "features/orders/components/orders-table";
import { MOCK_ORDERS, type MockOrder } from "features/orders/mock-data";
import { parseOrderFilters } from "features/orders/schemas";

function formatPrice(total?: number | string): string {
  if (total === undefined || total === null || total === "") return "-";
  const num = typeof total === "number" ? total : Number(total);
  return Number.isNaN(num) ? String(total) : `$${num.toFixed(2)}`;
}

function compareOrders(a: MockOrder, b: MockOrder, key: OrderSortKey): number {
  if (key === "total") return Number(a.total ?? 0) - Number(b.total ?? 0);
  return String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
}

function OrderDetailDrawer({ order, onClose }: { order: MockOrder | null; onClose: () => void }) {
  return (
    <Offcanvas show={order !== null} onHide={onClose} placement="end" scroll backdrop aria-labelledby="order-detail-title">
      {order ? (
        <>
          <Offcanvas.Header closeButton>
            <div>
              <Offcanvas.Title id="order-detail-title" className="mb-1">{order.reference}</Offcanvas.Title>
              <span className="text-muted small">Sample order detail</span>
            </div>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <span className="text-muted small d-block">Customer</span>
                <strong>{order.customer}</strong>
                <span className="text-muted small d-block">{order.email}</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="drawer-section">
              <h6 className="mb-3">Items</h6>
              <div className="d-flex flex-column gap-3">
                {order.items.map((item) => (
                  <div className="d-flex justify-content-between gap-3" key={item.name}>
                    <div>
                      <span className="d-block fw-medium">{item.name}</span>
                      <span className="text-muted small">Qty {item.quantity}</span>
                    </div>
                    <span className="fw-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between border-top mt-3 pt-3">
                <strong>Total</strong>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>

            <div className="drawer-section">
              <h6 className="mb-3">Shipping address</h6>
              <p className="text-muted mb-0">{order.shippingAddress}</p>
            </div>

            <div className="drawer-section">
              <h6 className="mb-3">Payment</h6>
              <p className="text-muted mb-0">{order.payment}</p>
            </div>

            <Button variant="outline-secondary" className="w-100">Open full order</Button>
          </Offcanvas.Body>
        </>
      ) : null}
    </Offcanvas>
  );
}

/** Order list mockup with local sample data, client-side sort/paging, and a detail drawer. */
export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // Nullable in the generated route types (a static prerender has no query string); an
  // empty set keeps the lists renderable and the parsers normalize what they get.
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const initialFilters = parseOrderFilters(Object.fromEntries(searchParams.entries()));
  const [search, setSearch] = useState(initialFilters.search);
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [sort, setSort] = useState<OrderSort>({ key: "placedAt", direction: "desc" });
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  function updateFilters(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToPage(pageNumber: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function updatePageSize(size: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(size));
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function updateSearch(value: string) {
    setSearch(value);
    updateFilters({ search: value || undefined });
  }

  function updateStatus(value: string) {
    setStatus(value);
    updateFilters({ status: value === "all" ? undefined : value });
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    updateFilters({ search: undefined, status: undefined });
  }

  function toggleSort(column: OrderSortKey) {
    setSort((current) => ({
      key: column,
      direction: current.key === column && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...MOCK_ORDERS]
      .filter((order) => {
        const matchesSearch = !query || `${order.reference} ${order.customer}`.toLowerCase().includes(query);
        const matchesStatus = status === "all" || order.status === status;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const result = compareOrders(a, b, sort.key);
        return sort.direction === "asc" ? result : -result;
      });
  }, [search, sort, status]);

  const pageSize = initialFilters.pageSize;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(initialFilters.page, 1), pageCount);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const completedCount = MOCK_ORDERS.filter((order) => order.status === "completed").length;
  const processingCount = MOCK_ORDERS.filter((order) => order.status === "processing").length;
  const pendingCount = MOCK_ORDERS.filter((order) => order.status === "pending").length;

  return (
    <PageShell
      title="Orders"
      actions={
        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" text="dark" className="mock-data-badge">Sample data</Badge>
          <Button variant="outline-secondary" size="sm" className="d-inline-flex align-items-center">
            <Download size={15} className="me-1" aria-hidden="true" />
            Export orders
          </Button>
        </div>
      }
      stats={
        <Row className="g-3">
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Total orders" value={MOCK_ORDERS.length} hint="All received orders" icon={<ShoppingBag size={16} />} />
          </Col>
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Completed" value={completedCount} hint="Fulfilled and delivered" tone="success" icon={<CheckCircle size={16} />} />
          </Col>
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Processing" value={processingCount} hint="In preparation or transit" tone="info" icon={<RefreshCw size={16} />} />
          </Col>
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Pending" value={pendingCount} hint="Awaiting payment or action" tone="warning" icon={<Clock size={16} />} />
          </Col>
        </Row>
      }
    >
      <Card className="shopee-card">
        <FilterBar onReset={resetFilters}>
          <div style={{ minWidth: 260 }}>
            <label htmlFor="order-search" className="visually-hidden">Search orders</label>
            <input
              id="order-search"
              type="search"
              className="form-control form-control-sm"
              placeholder="Search by order reference or customer"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </div>
          <SegmentedControl
            label="Filter by status"
            name="order-status"
            options={[
              { value: "all", label: "All" },
              { value: "completed", label: "Completed" },
              { value: "processing", label: "Processing" },
              { value: "pending", label: "Pending" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={status}
            onChange={updateStatus}
          />
        </FilterBar>
        <FilterChips
          chips={search.trim() ? [{ id: "search", label: "Search", value: search.trim() }] : []}
          onRemove={(id) => {
            if (id === "search") updateSearch("");
          }}
          onClearAll={resetFilters}
        />
        <div className="d-md-none px-4 pt-3">
          <label htmlFor="order-sort" className="visually-hidden">
            Sort orders
          </label>
          <select
            id="order-sort"
            className="form-select form-select-sm"
            value={`${sort.key}-${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split("-") as [
                OrderSortKey,
                SortDirection,
              ];
              setSort({ key, direction });
            }}
          >
            <option value="placedAt-desc">Newest first</option>
            <option value="placedAt-asc">Oldest first</option>
            <option value="total-desc">Total: high to low</option>
            <option value="total-asc">Total: low to high</option>
          </select>
        </div>

        <DataTable
          columns={orderColumns({ sort, onSort: toggleSort, onView: setSelectedOrder })}
          sort={{ key: sort.key, direction: sort.direction }}
          onSortChange={(key) => toggleSort(key as OrderSortKey)}
          rows={pagedRows}
          getRowKey={(order) => order.id}
          caption={`Sample orders: ${rows.length} matching.`}
          emptyState={<OrdersEmptyState />}
        />
        {rows.length > 0 ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPage={goToPage}
            itemLabel="orders"
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={updatePageSize}
          />
        ) : null}
      </Card>

      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </PageShell>
  );
}
