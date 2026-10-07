import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SegmentedControl from "widgets/segmented-control";

const OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
] as const;

describe("segmented control", () => {
  it("renders a labelled group with the current option checked", () => {
    render(
      <SegmentedControl
        label="Filter by status"
        name="status"
        options={[...OPTIONS]}
        value="active"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Filter by status" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Active" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).not.toBeChecked();
  });

  it("reports the chosen value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Filter by status"
        name="status"
        options={[...OPTIONS]}
        value="all"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Draft" }));
    expect(onChange).toHaveBeenCalledWith("draft");
  });
});
