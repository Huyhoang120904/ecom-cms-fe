import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FilterChips from "widgets/filter-chips";

const CHIPS = [{ id: "search", label: "Search", value: "lamp" }];

describe("filter chips", () => {
  it("renders one removable button per active filter plus clear-all", () => {
    render(<FilterChips chips={CHIPS} onRemove={vi.fn()} onClearAll={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Remove Search filter: lamp" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  it("removes one chip and clears all", () => {
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    render(
      <FilterChips
        chips={[...CHIPS, { id: "status", label: "Status", value: "Active" }]}
        onRemove={onRemove}
        onClearAll={onClearAll}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Status filter: Active" }));
    expect(onRemove).toHaveBeenCalledWith("status");
    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it("renders nothing when no filter is active", () => {
    const { container } = render(
      <FilterChips chips={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
