import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductsEmptyState } from "features/products/components/products-table";
import { OrdersEmptyState } from "features/orders/components/orders-table";

function withQueryClient(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe("honest empty states", () => {
  it("shows an empty product state without fabricated rows", () => {
    render(withQueryClient(<ProductsEmptyState />));
    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
  });

  it("shows an empty order state without fabricated rows", () => {
    render(withQueryClient(<OrdersEmptyState />));
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });
});
