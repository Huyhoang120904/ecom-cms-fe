import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DataTable, { type DataTableColumn } from "widgets/data-table";

interface Row {
  id: string;
  name: string;
  total: number;
}

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", render: (row) => row.name },
  { id: "total", header: "Total", sortable: true, render: (row) => String(row.total) },
];

const ROWS: Row[] = [
  { id: "a", name: "Alpha", total: 10 },
  { id: "b", name: "Beta", total: 20 },
];

function renderTable(sort?: { key: string; direction: "asc" | "desc" }) {
  const onSortChange = vi.fn();
  render(
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      getRowKey={(row) => row.id}
      sort={sort}
      onSortChange={onSortChange}
    />,
  );
  return onSortChange;
}

describe("data table sorting", () => {
  it("marks an unsorted sortable column and reports its key on click", () => {
    const onSortChange = renderTable();

    const header = screen.getByRole("columnheader", { name: /total/i });
    expect(header).toHaveAttribute("aria-sort", "none");
    fireEvent.click(within(header).getByRole("button", { name: "Sort by Total" }));
    expect(onSortChange).toHaveBeenCalledWith("total");
  });

  it("reflects the active direction on the sorted column only", () => {
    renderTable({ key: "total", direction: "desc" });

    expect(screen.getByRole("columnheader", { name: /total/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByRole("columnheader", { name: /name/i })).not.toHaveAttribute("aria-sort");
  });

  it("uses an explicit sort key when it differs from the column id", () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={[
          { id: "placed", header: "Placed", sortable: true, sortKey: "placedAt", render: () => "x" },
        ]}
        rows={[{ id: "a", name: "Alpha", total: 1 }]}
        getRowKey={(row) => row.id}
        onSortChange={onSortChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sort by Placed" }));
    expect(onSortChange).toHaveBeenCalledWith("placedAt");
  });

  it("renders a plain header when no sort handler is given", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(row) => row.id} />);

    const header = screen.getByRole("columnheader", { name: /total/i });
    expect(header).not.toHaveAttribute("aria-sort");
    expect(within(header).queryByRole("button")).not.toBeInTheDocument();
  });
});
