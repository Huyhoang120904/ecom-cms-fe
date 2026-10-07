import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Pagination from "widgets/pagination";

describe("pagination numbers and page size", () => {
  it("renders every page when the count fits", () => {
    render(<Pagination page={2} pageSize={20} total={60} onPage={vi.fn()} />);

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(nav).getByRole("button", { name: "Go to page 1" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Go to page 3" })).toBeInTheDocument();
    const current = within(nav).getByRole("button", { name: "Go to page 2" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toBeDisabled();
  });

  it("collapses a long range with an ellipsis and jumps on click", () => {
    const onPage = vi.fn();
    render(<Pagination page={5} pageSize={20} total={400} onPage={onPage} />);

    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(nav).getByRole("button", { name: "Go to page 1" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Go to page 20" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Go to page 4" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Go to page 6" })).toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: "Go to page 10" })).not.toBeInTheDocument();

    fireEvent.click(within(nav).getByRole("button", { name: "Go to page 6" }));
    expect(onPage).toHaveBeenCalledWith(6);
  });

  it("offers a page size only when a handler is given", () => {
    const onPageSizeChange = vi.fn();
    const { rerender } = render(
      <Pagination
        page={1}
        pageSize={20}
        total={60}
        onPage={vi.fn()}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/rows per page/i), { target: { value: "50" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(50);

    rerender(<Pagination page={1} pageSize={20} total={60} onPage={vi.fn()} />);
    expect(screen.queryByLabelText(/rows per page/i)).not.toBeInTheDocument();
  });
});
