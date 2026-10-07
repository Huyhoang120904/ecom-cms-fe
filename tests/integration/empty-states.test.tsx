import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrdersEmptyState } from "features/orders/components/orders-table";
import { ProductsEmptyState } from "features/products/components/products-table";

import { renderWithProviders, sessionFixture } from "../helpers";

describe("honest empty states", () => {
  it("shows an empty product state without fabricated rows", () => {
    renderWithProviders(<ProductsEmptyState canWrite />, { session: sessionFixture });
    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
    // The next step is offered only to a role that may take it.
    expect(screen.getByRole("link", { name: /add your first product/i })).toBeInTheDocument();
  });

  it("tells a read-only role why it cannot add a product", () => {
    renderWithProviders(<ProductsEmptyState canWrite={false} />, { session: sessionFixture });
    expect(screen.getByText(/can read this shop's products but not create them/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /add your first product/i })).not.toBeInTheDocument();
  });

  it("shows an empty order state without fabricated rows", () => {
    renderWithProviders(<OrdersEmptyState />, { session: sessionFixture });
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });
});
