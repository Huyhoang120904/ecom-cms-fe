import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Package } from "react-feather";

import FilterBar from "widgets/filter-bar";
import PageShell from "widgets/page-shell";
import StatCard from "widgets/stat-card";

describe("list chrome", () => {
  it("page shell renders a level-one heading, actions, stats, and content", () => {
    render(
      <PageShell
        title="Products"
        actions={<button type="button">Add product</button>}
        stats={<StatCard label="Total products" value={42} />}
      >
        <p>list content</p>
      </PageShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add product" })).toBeInTheDocument();
    expect(screen.getByText("Total products")).toBeInTheDocument();
    expect(screen.getByText("list content")).toBeInTheDocument();
  });

  it("filter bar is a search landmark and only offers reset when one is given", () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <FilterBar onReset={onReset}>
        <input aria-label="Status" />
      </FilterBar>,
    );

    expect(screen.getByRole("search")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledOnce();

    rerender(
      <FilterBar>
        <input aria-label="Status" />
      </FilterBar>,
    );
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("stat card renders label, value, hint, and a toned icon well", () => {
    const { container } = render(
      <StatCard
        label="Total orders"
        value="6"
        hint="All received orders"
        icon={<Package size={16} />}
        tone="success"
      />,
    );

    expect(screen.getByText("Total orders")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("All received orders")).toBeInTheDocument();
    expect(container.querySelector(".stat-icon.stat-icon-success")).not.toBeNull();
  });
});
