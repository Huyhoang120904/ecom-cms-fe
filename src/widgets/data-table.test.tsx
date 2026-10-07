import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import DataTable, { type DataTableColumn } from "widgets/data-table";
import Pagination from "widgets/pagination";

interface Row {
  id: string;
  name: string;
}

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", render: (row) => row.name },
  { id: "actions", header: "Actions", align: "end", render: (row) => <button type="button">View {row.name}</button> },
];

const ROWS: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
];

function renderTable(overrides: Partial<ComponentProps<typeof DataTable<Row>>> = {}) {
  return render(
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      getRowKey={(row) => row.id}
      caption="Sample rows"
      {...overrides}
    />,
  );
}

describe("data table", () => {
  it("renders a captioned table with a row per record", () => {
    renderTable();

    expect(screen.getByRole("table", { name: "Sample rows" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Beta" })).toBeInTheDocument();
  });

  it("applies a column's className to both its header and body cells", () => {
    const columns: DataTableColumn<Row>[] = [
      { id: "name", header: "Name", className: "text-nowrap", render: (row) => row.name },
    ];

    render(<DataTable columns={columns} rows={ROWS} getRowKey={(row) => row.id} />);

    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass("text-nowrap");
    expect(screen.getByRole("cell", { name: "Alpha" })).toHaveClass("text-nowrap");
    expect(screen.getByRole("cell", { name: "Beta" })).toHaveClass("text-nowrap");
  });

  it("shows the smooth skeleton while loading and hides it from assistive tech", () => {
    const { container } = renderTable({ rows: [], isLoading: true, loadingRows: 3 });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(3);
  });

  it("renders the empty slot without a table when there are no rows", () => {
    renderTable({ rows: [], emptyState: <p>No products yet</p> });

    expect(screen.getByText("No products yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("surfaces the error with a retry that re-fires the query", () => {
    const onRetry = vi.fn();
    renderTable({ rows: [], errorMessage: "Not allowed", onRetry });

    expect(screen.getByRole("alert")).toHaveTextContent("Not allowed");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("pagination", () => {
  it("reports the server's own range and page count", () => {
    render(<Pagination page={2} pageSize={20} total={42} onPage={vi.fn()} itemLabel="products" />);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByText(/showing 21–40 of 42 products/i)).toBeInTheDocument();
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
  });

  it("moves through the page handler and disables out-of-range directions", () => {
    const onPage = vi.fn();
    const { rerender } = render(
      <Pagination page={2} pageSize={20} total={42} onPage={onPage} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPage).toHaveBeenNthCalledWith(1, 1);
    expect(onPage).toHaveBeenNthCalledWith(2, 3);

    rerender(<Pagination page={1} pageSize={20} total={42} onPage={onPage} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();

    rerender(<Pagination page={3} pageSize={20} total={42} onPage={onPage} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("clamps a stale page and keeps both directions disabled on an empty list", () => {
    render(<Pagination page={9} pageSize={20} total={0} onPage={vi.fn()} />);

    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
