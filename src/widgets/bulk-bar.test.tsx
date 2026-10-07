import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BulkBar from "widgets/bulk-bar";

const ACTIONS = [
  { id: "publish", label: "Publish" },
  {
    id: "delete",
    label: "Delete",
    variant: "danger" as const,
    confirm: { title: "Delete 2 items?", body: "This cannot be undone.", confirmLabel: "Delete" },
  },
];

describe("bulk bar", () => {
  it("announces the selection and offers one-tap actions plus clear", () => {
    const onAction = vi.fn();
    const onClear = vi.fn();
    render(
      <BulkBar countLabel="2 products selected" actions={ACTIONS} onAction={onAction} onClear={onClear} />,
    );

    expect(screen.getByText("2 products selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onAction).toHaveBeenCalledWith("publish");
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("disables everything while a run is pending", () => {
    render(
      <BulkBar countLabel="2 products selected" actions={ACTIONS} onAction={vi.fn()} onClear={vi.fn()} isPending />,
    );

    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
  });

  it("asks for confirmation before a destructive action", () => {
    const onAction = vi.fn();
    render(
      <BulkBar countLabel="2 products selected" actions={ACTIONS} onAction={onAction} onClear={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("This cannot be undone.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const deletes = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deletes[deletes.length - 1]!);
    expect(onAction).toHaveBeenCalledWith("delete");
  });
});
