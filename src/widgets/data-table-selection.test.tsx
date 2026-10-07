import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DataTable, { type DataTableColumn } from "widgets/data-table";

interface Row {
  id: string;
  name: string;
}

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", render: (row) => row.name },
];

const ROWS: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
];

describe("data table selection", () => {
  it("renders no checkboxes until a selection handler is given", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(row) => row.id} />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("selects and deselects one row", () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.name}
        selectedKeys={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select row Alpha" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
  });

  it("toggles the whole visible page from the header checkbox", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        selectedKeys={[]}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a", "b"]);

    rerender(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        selectedKeys={["a", "b"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    const header = screen.getByRole("checkbox", { name: "Select all rows" });
    expect(header).toBeChecked();
    fireEvent.click(header);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it("marks a partially selected page indeterminate and flags selected rows", () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        selectedKeys={["a"]}
        onSelectionChange={vi.fn()}
      />,
    );

    const header = screen.getByRole("checkbox", { name: "Select all rows" }) as HTMLInputElement;
    expect(header.indeterminate).toBe(true);
    expect(screen.getByRole("row", { name: /alpha/i })).toHaveAttribute("data-selected", "true");
    expect(screen.getByRole("row", { name: /beta/i })).not.toHaveAttribute("data-selected");
  });
});
