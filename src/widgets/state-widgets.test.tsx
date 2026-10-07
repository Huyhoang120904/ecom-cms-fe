import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Package } from "react-feather";

import EmptyState from "widgets/empty-state";
import ErrorState from "widgets/error-state";

describe("state widgets", () => {
  it("renders an honest empty state with one next action", () => {
    render(
      <EmptyState
        icon={<Package size={24} />}
        title="No products yet"
        body="This shop has no products."
        action={{ label: "Add your first product", href: "/products/new" }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No products yet");
    expect(screen.getByRole("link", { name: "Add your first product" })).toHaveAttribute(
      "href",
      "/products/new",
    );
  });

  it("omits the action when the role cannot take it and shows the fallback note", () => {
    render(
      <EmptyState title="No products yet" body="Read-only role.">
        <span>Your role can only read.</span>
      </EmptyState>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Your role can only read.")).toBeInTheDocument();
  });

  it("announces an error and retries through the handler", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Products failed to load." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Products failed to load.");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders no retry button when no handler is given", () => {
    render(<ErrorState message="Products failed to load." />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
