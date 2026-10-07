import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DataTable, { type DataTableColumn } from "widgets/data-table";

interface Row {
  id: string;
  name: string;
  brand: string;
}

const COLUMNS: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", mobile: { label: "Product" }, render: (row) => row.name },
  { id: "brand", header: "Brand", mobile: { hide: true }, render: (row) => row.brand },
  { id: "actions", header: "Actions", align: "end", mobile: {}, render: () => <button type="button">View</button> },
];

const ROWS: Row[] = [{ id: "a", name: "Alpha", brand: "Acme" }];

describe("data table cards", () => {
  it("renders label/value cards instead of a table when forced", () => {
    render(
      <DataTable columns={COLUMNS} rows={ROWS} getRowKey={(row) => row.id} layout="cards" />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  it("keeps the table when forced, and selects rows on cards", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <DataTable columns={COLUMNS} rows={ROWS} getRowKey={(row) => row.id} layout="table" />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();

    rerender(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.name}
        selectedKeys={[]}
        onSelectionChange={onSelectionChange}
        layout="cards"
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Select row Alpha" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
  });

  it("renders card skeletons while loading", () => {
    const { container } = render(
      <DataTable columns={COLUMNS} rows={[]} getRowKey={(row) => row.id} isLoading layout="cards" />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"].data-card')).toHaveLength(5);
  });
});
