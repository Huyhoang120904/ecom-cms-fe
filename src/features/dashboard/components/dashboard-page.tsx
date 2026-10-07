"use client";

import Link from "next/link";
import { Card, Col, Row } from "react-bootstrap";

import PageHeading from "widgets/page-heading";

import { useAuth } from "features/auth/auth-context";
import { useProductsQuery } from "features/products/queries";

function TodoTile({
  label,
  href,
  value,
  hint,
}: {
  label: string;
  href: string;
  value: string;
  hint: string;
}) {
  return (
    <Link href={href} className="shopee-todo-item" aria-label={`${label}: ${value}`}>
      <span className="todo-count" aria-hidden="true">
        {value}
      </span>
      <span className="todo-label">{label}</span>
      <span className="visually-hidden">{hint}</span>
    </Link>
  );
}

/** Shopee Seller Centre Home: To-do list, shop overview, insights, notices. */
export default function DashboardPage() {
  const { session } = useAuth();
  const shopName = session?.active_shop?.name ?? "Your shop";
  const products = useProductsQuery({ page: 1, pageSize: 1, status: undefined });
  const productTotal = products.isPending ? "…" : String(products.data?.total ?? "—");

  return (
    <div className="container-fluid p-3 p-md-4 shopee-page">
      <PageHeading heading={`Hello, ${shopName}`}>
        <span className="text-muted small">Here is what needs attention today.</span>
      </PageHeading>

      {/* To-do list — Shopee's 8-slot action grid */}
      <Card className="shopee-card mb-3">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <h2 className="h4">To-do list</h2>
          <Link href="/orders" className="small text-decoration-none">
            View all orders
          </Link>
        </Card.Header>
        <Card.Body>
          <div className="shopee-todo-grid">
            <TodoTile label="To ship" href="/orders" value="—" hint="No order endpoint yet" />
            <TodoTile label="Pending payment" href="/orders" value="—" hint="No order endpoint yet" />
            <TodoTile label="Returns / refunds" href="/orders" value="—" hint="No order endpoint yet" />
            <TodoTile label="Completed" href="/orders" value="—" hint="No order endpoint yet" />
            <TodoTile
              label="Total products"
              href="/products"
              value={productTotal}
              hint={products.isError ? "Product list failed to load" : "Live product count"}
            />
            <TodoTile label="Draft products" href="/products?status=draft" value="—" hint="Filter products by draft" />
            <TodoTile label="Active products" href="/products?status=active" value="—" hint="Filter products by active" />
            <TodoTile label="Shop settings" href="/shop" value="›" hint="Review shop profile" />
          </div>
          <p className="text-muted small mb-0 mt-3">
            Tiles showing — have no backend endpoint yet. Counts appear only when the API exposes them.
          </p>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col xl={6} md={6}>
          <Card className="shopee-card h-100">
            <Card.Header>
              <h2 className="h4">Shop overview</h2>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-baseline mb-2">
                <span className="text-muted small">Products</span>
                <strong className="fs-5" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {productTotal}
                </strong>
              </div>
              <div className="d-flex justify-content-between align-items-baseline mb-3">
                <span className="text-muted small">Orders</span>
                <strong className="fs-5">—</strong>
              </div>
              <p className="text-muted small mb-0">
                No sales summary yet. Summaries appear once the order endpoints land.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6} md={6}>
          <Card className="shopee-card h-100">
            <Card.Header>
              <h2 className="h4">Announcements</h2>
            </Card.Header>
            <Card.Body>
              <ul className="small mb-0 ps-3 d-flex flex-column gap-2">
                <li>
                  <Link href="/products/new">Add your first product</Link>
                  <span className="text-muted"> — publish to go live.</span>
                </li>
                <li>
                  <Link href="/shop">Complete your shop profile</Link>
                  <span className="text-muted"> — name, logo, and policies.</span>
                </li>
                <li>
                  <Link href="/orders">Review incoming orders</Link>
                  <span className="text-muted"> — fulfil from the order list.</span>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
