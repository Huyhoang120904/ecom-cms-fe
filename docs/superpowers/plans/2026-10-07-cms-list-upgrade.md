# CMS List Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved list upgrade — segmented status tabs, filter chips, row selection with honest bulk publish/unpublish, a sorting API, sticky headers, mobile card layout, and numbered pagination with per-page sizing — on products then orders.

**Architecture:** Extend the existing `src/widgets/` components with optional fields (nothing breaks current consumers); features own all state and data behavior. Products stays server-driven (no sorting — the contract has none); orders uses the full client-side set. The bulk runner lives in `products/mutations.ts` on the `api.ts` `publishProduct`/`unpublishProduct` functions with `Promise.allSettled`, because the per-id hook factories cannot be instantiated in a loop.

**Tech Stack:** Next.js 16 App Router, TypeScript (strict, `noUncheckedIndexedAccess`), Bootstrap 5 / react-bootstrap 2, SCSS (`sass`), `react-feather`, vitest 5 + Testing Library (jsdom), `pnpm` only.

**Spec:** `docs/superpowers/specs/2026-10-07-cms-list-upgrade-design.md`

## Global Constraints

- pnpm only; never hand-edit `pnpm-lock.yaml`.
- Gates where code changes: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`.
- Feature modules own components/queries/schemas/pages; widgets are presentational.
- No invented data; auth/session/query/envelope code untouched.
- The products list endpoint accepts only `status`, `page`, `page_size` — never add a search box, category picker, or client-side sort to products.
- Product deletion stays single-item typed-name; there is no bulk delete.
- Commits land on the current branch; push once at the end, not per task.

---

### Task 1: SegmentedControl widget

**Files:**
- Create: `src/widgets/segmented-control.tsx`
- Modify: `src/styles/_user.scss` (append `.segmented-control` styles)
- Test: `src/widgets/segmented-control.test.tsx`

**Interfaces:**
- Consumes: `--shopee-*` tokens.
- Produces: `SegmentedOption<T> { value: T; label: string }`; `SegmentedControlProps<T extends string> { label: string; name: string; options: SegmentedOption<T>[]; value: T; onChange: (value: T) => void }` (default export).

- [ ] **Step 1: Write the failing test**

Create `src/widgets/segmented-control.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/segmented-control.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement SegmentedControl**

Create `src/widgets/segmented-control.tsx`:

```tsx
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  name: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * One-tap option group backed by real radio inputs, so arrow-key navigation,
 * checked state, and group semantics come from the platform.
 */
export default function SegmentedControl<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className="segmented-option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="visually-hidden"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/styles/_user.scss`:

```scss
.segmented-control {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid var(--shopee-border);
  border-radius: var(--shopee-radius);
  background-color: var(--shopee-surface);
}

.segmented-option {
  margin-bottom: 0;

  > span {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0 1rem;
    border-radius: calc(var(--shopee-radius) - 2px);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--shopee-muted-text);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  input:checked + span {
    background-color: var(--shopee-primary);
    color: var(--shopee-surface);
  }

  input:not(:checked) + span:hover {
    background-color: var(--shopee-primary-soft);
    color: var(--shopee-primary);
  }

  input:focus-visible + span {
    outline: 2px solid var(--shopee-primary);
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .segmented-option > span {
    transition: none;
  }
}
```

- [ ] **Step 5: Run tests and gates**

Run: `pnpm vitest run src/widgets/segmented-control.test.tsx` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/widgets/segmented-control.tsx src/widgets/segmented-control.test.tsx src/styles/_user.scss
git commit -m "feat: add segmented control widget"
```

---

### Task 2: FilterChips widget

**Files:**
- Create: `src/widgets/filter-chips.tsx`
- Modify: `src/styles/_user.scss` (append `.filter-chips` styles)
- Test: `src/widgets/filter-chips.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `FilterChip { id: string; label: string; value: string }`; `FilterChipsProps { chips: FilterChip[]; onRemove: (id: string) => void; onClearAll: () => void }` (default export).

- [ ] **Step 1: Write the failing test**

Create `src/widgets/filter-chips.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/filter-chips.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement FilterChips**

Create `src/widgets/filter-chips.tsx`:

```tsx
import { X } from "react-feather";

export interface FilterChip {
  id: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

/** Active filters as removable buttons plus a clear-all. Renders nothing when empty. */
export default function FilterChips({ chips, onRemove, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="filter-chips">
      <ul className="filter-chip-list">
        {chips.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              className="filter-chip"
              aria-label={`Remove ${chip.label} filter: ${chip.value}`}
              onClick={() => onRemove(chip.id)}
            >
              <span aria-hidden="true">
                {chip.label}: {chip.value}
              </span>
              <X size={13} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-link btn-sm text-decoration-none px-1"
        onClick={onClearAll}
      >
        Clear all
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/styles/_user.scss`:

```scss
.filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.filter-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0 0.125rem 0 0.75rem;
  border: 1px solid var(--shopee-border);
  border-radius: 999px;
  background-color: var(--shopee-surface);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--shopee-text);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background-color: var(--shopee-background);
    color: var(--shopee-muted-text);
  }

  &:hover {
    border-color: var(--shopee-primary-border);
    background-color: var(--shopee-primary-soft);
  }

  &:focus-visible {
    outline: 2px solid var(--shopee-primary);
    outline-offset: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-chip {
    transition: none;
  }
}
```

- [ ] **Step 5: Run tests and gates**

Run: `pnpm vitest run src/widgets/filter-chips.test.tsx` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/widgets/filter-chips.tsx src/widgets/filter-chips.test.tsx src/styles/_user.scss
git commit -m "feat: add filter chips widget"
```

---

### Task 3: BulkBar widget

**Files:**
- Create: `src/widgets/bulk-bar.tsx`
- Modify: `src/styles/_user.scss` (append `.bulk-bar` styles)
- Test: `src/widgets/bulk-bar.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `BulkBarAction { id: string; label: string; icon?: ReactNode; variant?: "primary" | "outline-secondary" | "danger"; confirm?: { title: string; body: string; confirmLabel: string } }`; `BulkBarProps { countLabel: string; actions: BulkBarAction[]; onAction: (id: string) => void; onClear: () => void; isPending?: boolean }` (default export).

- [ ] **Step 1: Write the failing test**

Create `src/widgets/bulk-bar.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/bulk-bar.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement BulkBar**

Create `src/widgets/bulk-bar.tsx`:

```tsx
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "react-bootstrap";

export interface BulkBarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "outline-secondary" | "danger";
  confirm?: { title: string; body: string; confirmLabel: string };
}

interface BulkBarProps {
  countLabel: string;
  actions: BulkBarAction[];
  onAction: (id: string) => void;
  onClear: () => void;
  isPending?: boolean;
}

/** Selection bar: the count, one-tap actions, an inline confirm, pending state. */
export default function BulkBar({
  countLabel,
  actions,
  onAction,
  onClear,
  isPending = false,
}: BulkBarProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const pendingAction = actions.find((action) => action.id === confirming);

  function act(action: BulkBarAction) {
    if (action.confirm) setConfirming(action.id);
    else onAction(action.id);
  }

  function clear() {
    setConfirming(null);
    onClear();
  }

  return (
    <div className="bulk-bar">
      <span className="bulk-bar-count" role="status">
        {countLabel}
      </span>
      <div className="d-flex flex-wrap align-items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant={action.variant ?? "outline-secondary"}
            size="sm"
            className="d-inline-flex align-items-center gap-1"
            disabled={isPending}
            onClick={() => act(action)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="text-decoration-none"
          disabled={isPending}
          onClick={clear}
        >
          Clear
        </Button>
      </div>
      {pendingAction?.confirm ? (
        <div className="bulk-bar-confirm" role="group" aria-label={pendingAction.confirm.title}>
          <strong className="d-block mb-1">{pendingAction.confirm.title}</strong>
          <p className="text-muted small mb-2">{pendingAction.confirm.body}</p>
          <div className="d-flex gap-2">
            <Button
              type="button"
              variant={pendingAction.variant ?? "outline-secondary"}
              size="sm"
              disabled={isPending}
              onClick={() => {
                setConfirming(null);
                onAction(pendingAction.id);
              }}
            >
              {pendingAction.confirm.confirmLabel}
            </Button>
            <Button type="button" variant="outline-secondary" size="sm" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/styles/_user.scss`:

```scss
.bulk-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--shopee-border);
  background-color: var(--shopee-primary-soft);
}

.bulk-bar-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--shopee-text);
}

.bulk-bar-confirm {
  flex-basis: 100%;
  padding: 0.75rem;
  border: 1px solid var(--shopee-border);
  border-radius: var(--shopee-radius);
  background-color: var(--shopee-surface);
}
```

- [ ] **Step 5: Run tests and gates**

Run: `pnpm vitest run src/widgets/bulk-bar.test.tsx` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/widgets/bulk-bar.tsx src/widgets/bulk-bar.test.tsx src/styles/_user.scss
git commit -m "feat: add bulk bar widget"
```

---

### Task 4: DataTable sorting

**Files:**
- Modify: `src/widgets/data-table.tsx` (column fields, props, header render, feather icon import)
- Test: `src/widgets/data-table-sort.test.tsx`

**Interfaces:**
- Consumes: `DataTableColumn`, `DataTable` from the same file.
- Produces: column additions `sortable?: boolean; sortKey?: string; sortLabel?: string`; props additions `sort?: DataTableSort; onSortChange?: (key: string) => void`; exported `SortDirection = "asc" | "desc"` and `DataTableSort { key: string; direction: SortDirection }`.

- [ ] **Step 1: Write the failing test**

Create `src/widgets/data-table-sort.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/data-table-sort.test.tsx`
Expected: FAIL — `sortable`/`sort`/`onSortChange` are unknown (the TypeScript import error counts as the RED).

- [ ] **Step 3: Implement sorting**

In `src/widgets/data-table.tsx`, make exactly these edits:

1. Add the feather import at the top (after the react-bootstrap import):

```tsx
import { ChevronDown, ChevronUp, ChevronsDown } from "react-feather";
```

2. Add to the `DataTableColumn` interface (after `skeletonWidth`):

```tsx
  /** Opt-in header sort button. The feature owns the sort state and the row order. */
  sortable?: boolean;
  /** Key reported to `onSortChange`. Defaults to the column id. */
  sortKey?: string;
  /** Accessible label for the sort button. Defaults to the header when it is a string. */
  sortLabel?: string;
```

3. Add above the props interface:

```tsx
export type SortDirection = "asc" | "desc";

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}
```

4. Add to the props interface:

```tsx
  sort?: DataTableSort;
  onSortChange?: (key: string) => void;
```

5. Destructure `sort` and `onSortChange` in the component signature (no defaults).

6. Replace the `head` constant with:

```tsx
  const head = (
    <thead className="table-light">
      <tr>
        {columns.map((column) => {
          const sortable = column.sortable === true && onSortChange !== undefined;
          const key = column.sortKey ?? column.id;
          const active = sortable && sort?.key === key;
          const label =
            column.sortLabel ?? (typeof column.header === "string" ? column.header : column.id);
          const Icon = !active ? ChevronsDown : sort?.direction === "asc" ? ChevronUp : ChevronDown;
          return (
            <th
              key={column.id}
              scope="col"
              style={column.width ? { width: column.width } : undefined}
              className={headerCellClass(column)}
              aria-sort={
                !sortable
                  ? undefined
                  : !active
                    ? "none"
                    : sort?.direction === "asc"
                      ? "ascending"
                      : "descending"
              }
            >
              {sortable && onSortChange ? (
                <button
                  type="button"
                  className="table-sort-btn"
                  aria-label={`Sort by ${label}`}
                  onClick={() => onSortChange(key)}
                >
                  <span>{column.header}</span>
                  <Icon size={14} aria-hidden="true" />
                </button>
              ) : (
                column.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
```

(The shared `head` feeds the loading and ready branches, so both gain sorting headers.)

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run src/widgets/` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/data-table.tsx src/widgets/data-table-sort.test.tsx
git commit -m "feat: add sorting to the shared data table"
```

---

### Task 5: DataTable row selection

**Files:**
- Modify: `src/widgets/data-table.tsx` (props, checkbox column, `data-selected`)
- Test: `src/widgets/data-table-selection.test.tsx`

**Interfaces:**
- Consumes: `DataTable`, `DataTableColumn` from the same file.
- Produces: props additions `selectedKeys?: string[]; onSelectionChange?: (keys: string[]) => void; getRowLabel?: (row: Row) => string`. Selection is page-scoped: the header checkbox toggles only the visible rows.

- [ ] **Step 1: Write the failing test**

Create `src/widgets/data-table-selection.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/data-table-selection.test.tsx`
Expected: FAIL — `selectedKeys`/`onSelectionChange`/`getRowLabel` are unknown.

- [ ] **Step 3: Implement selection**

In `src/widgets/data-table.tsx`, make exactly these edits:

1. Add to the props interface:

```tsx
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Accessible row name for the row checkbox. Defaults to the row key. */
  getRowLabel?: (row: Row) => string;
```

2. Destructure `selectedKeys`, `onSelectionChange`, `getRowLabel` in the component signature (no defaults).

3. Before the `head` constant, add the selection helpers (the header checkbox reads them, so placing them after `head` would TDZ-error):

```tsx
  const selectable = onSelectionChange !== undefined;
  const selected = new Set(selectedKeys ?? []);
  const labelOf = getRowLabel ?? getRowKey;
  const allVisible = rows.length > 0 && rows.every((row) => selected.has(getRowKey(row)));
  const someVisible = rows.some((row) => selected.has(getRowKey(row)));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allVisible) {
      const visible = new Set(rows.map((row) => getRowKey(row)));
      onSelectionChange((selectedKeys ?? []).filter((key) => !visible.has(key)));
    } else {
      const next = [...(selectedKeys ?? [])];
      for (const row of rows) {
        const key = getRowKey(row);
        if (!next.includes(key)) next.push(key);
      }
      onSelectionChange(next);
    }
  }

  function toggleOne(key: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selected.has(key)
        ? (selectedKeys ?? []).filter((current) => current !== key)
        : [...(selectedKeys ?? []), key],
    );
  }
```

4. Prepend the checkbox header cell inside the `head` `<tr>`, before the `{columns.map(...)}`:

```tsx
          {selectable ? (
            <th scope="col" className="data-table-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={allVisible}
                ref={(node) => {
                  if (node) node.indeterminate = !allVisible && someVisible;
                }}
                aria-label="Select all rows"
                onChange={toggleAll}
              />
            </th>
          ) : null}
```

5. Prepend the checkbox body cell inside the ready-branch row render, before the `{columns.map(...)}`:

```tsx
            {selectable ? (
              <td className="data-table-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.has(getRowKey(row))}
                  aria-label={`Select row ${labelOf(row)}`}
                  onChange={() => toggleOne(getRowKey(row))}
                />
              </td>
            ) : null}
```

6. Add `data-selected` to the ready-branch `<tr>`:

```tsx
          <tr key={getRowKey(row)} data-selected={selected.has(getRowKey(row)) ? "true" : undefined}>
```

7. In the loading skeleton rows, prepend an empty leading cell when selectable (inside the skeleton `<tr>`, before the columns map):

```tsx
              {selectable ? <td className="data-table-check" aria-hidden="true" /> : null}
```

(The skeleton `<tr>` already carries `aria-hidden="true"`, so the extra cell stays hidden too.)

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run src/widgets/` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/data-table.tsx src/widgets/data-table-selection.test.tsx
git commit -m "feat: add row selection to the shared data table"
```

---

### Task 6: DataTable mobile cards

**Files:**
- Modify: `src/widgets/data-table.tsx` (column field, `layout` prop, private media hook, card branches)
- Modify: `src/styles/_user.scss` (append card styles)
- Test: `src/widgets/data-table-cards.test.tsx`

**Interfaces:**
- Consumes: selection and sort props from Tasks 4–5 (cards reuse them; sort buttons are not rendered on cards).
- Produces: column addition `mobile?: { label?: string; hide?: boolean }`; prop addition `layout?: "auto" | "table" | "cards"`. A column without `mobile` is skipped on cards; a `mobile` without `label` renders full-width without a label row.

- [ ] **Step 1: Write the failing test**

Create `src/widgets/data-table-cards.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/data-table-cards.test.tsx`
Expected: FAIL — `mobile`/`layout` are unknown.

- [ ] **Step 3: Implement cards**

In `src/widgets/data-table.tsx`, make exactly these edits:

1. Add to the `DataTableColumn` interface:

```tsx
  /**
   * Card-mode mapping under 768px. A column without `mobile` is skipped on
   * cards; `hide` skips it explicitly; a mapping without `label` renders the
   * value full-width with no label row (used for the actions column).
   */
  mobile?: { label?: string; hide?: boolean };
```

2. Add to the props interface:

```tsx
  /** `"auto"` follows a 768px media query; explicit values exist so tests can force either rendering. */
  layout?: "auto" | "table" | "cards";
```

3. Destructure `layout = "auto"` in the component signature.

4. Add the private media hook above the component (after the `headerCellClass` helper):

```tsx
const MOBILE_QUERY = "(max-width: 767.98px)";

/** Viewport match without a hooks directory: this is the only consumer. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia !== "undefined"
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
```

Add `useEffect` and `useState` to the React import (currently `import type { ReactNode } from "react"` — change to `import { useEffect, useState } from "react";` plus the separate type import).

5. After the selection helpers, compute the rendering mode and the card body:

```tsx
  const cards = layout === "cards" || (layout === "auto" && useMediaQuery(MOBILE_QUERY));
```

Wait — hooks cannot be called conditionally, but this call is unconditional (the argument varies, not the call). `useMediaQuery(MOBILE_QUERY)` unconditionally is fine; the `layout === "cards"` short-circuit only skips using the result, not the call. To keep it obviously unconditional, write:

```tsx
  const isMobileViewport = useMediaQuery(MOBILE_QUERY);
  const cards = layout === "cards" || (layout === "auto" && isMobileViewport);
```

6. In the loading branch, return card skeletons when `cards` (before the table skeleton return):

```tsx
  if (isLoading && cards) {
    return (
      <div className="data-card-list">
        {Array.from({ length: loadingRows }, (_, index) => (
          <div key={index} aria-hidden="true" className="shopee-card data-card">
            <span className="shopee-skeleton" style={{ width: 140 }} />
            <span className="shopee-skeleton" style={{ width: 96 }} />
          </div>
        ))}
      </div>
    );
  }
```

7. In the ready branch, return the card list when `cards` (before the table return):

```tsx
  if (cards) {
    return (
      <ul className="data-card-list" role="list">
        {rows.map((row) => {
          const key = getRowKey(row);
          return (
            <li key={key} className="shopee-card data-card" data-selected={selected.has(key) ? "true" : undefined}>
              {selectable ? (
                <div className="data-card-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.has(key)}
                    aria-label={`Select row ${labelOf(row)}`}
                    onChange={() => toggleOne(key)}
                  />
                </div>
              ) : null}
              {columns.map((column) => {
                if (!column.mobile || column.mobile.hide) return null;
                return (
                  <div key={column.id} className="data-card-field">
                    {column.mobile.label ? (
                      <span className="data-card-label">{column.mobile.label}</span>
                    ) : null}
                    <span className="data-card-value">{column.render(row)}</span>
                  </div>
                );
              })}
            </li>
          );
        })}
      </ul>
    );
  }
```

(`selectable`, `selected`, `labelOf`, `toggleOne` come from Task 5 and already exist above these branches. The empty branch stays shared: no table and no list when there are no rows.)

8. The `role="list"` on a `ul` is redundant (a `ul` already exposes a list role) — drop it to keep the markup clean:

```tsx
    return (
      <ul className="data-card-list">
```

(Use this form, not the one with `role="list"`.)

- [ ] **Step 4: Add the card styles**

Append to `src/styles/_user.scss`:

```scss
.data-card-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 1rem;
  list-style: none;
}

.data-card {
  padding: 0.75rem 1rem;
}

.data-card-check {
  margin-bottom: 0.5rem;
}

.data-card-field {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.375rem 0;
}

.data-card-field + .data-card-field {
  border-top: 1px solid var(--shopee-border);
}

.data-card-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04rem;
  color: var(--shopee-muted-text);
}

.data-card-value {
  text-align: right;
  font-size: 0.875rem;
}
```

- [ ] **Step 5: Run tests and gates**

Run: `pnpm vitest run src/widgets/` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/widgets/data-table.tsx src/widgets/data-table-cards.test.tsx src/styles/_user.scss
git commit -m "feat: add mobile card layout to the shared data table"
```

### Task 7: Pagination numbers and per-page sizing

**Files:**
- Modify: `src/widgets/pagination.tsx` (numbered buttons, per-page select)
- Test: `src/widgets/pagination-numbers.test.tsx`

**Interfaces:**
- Consumes: `PaginationProps` from the same file.
- Produces: props additions `pageSizeOptions?: number[]; onPageSizeChange?: (size: number) => void`. The per-page select renders only when both are given.

- [ ] **Step 1: Write the failing test**

Create `src/widgets/pagination-numbers.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/widgets/pagination-numbers.test.tsx`
Expected: FAIL — `pageSizeOptions`/`onPageSizeChange` are unknown and no numbered buttons exist.

- [ ] **Step 3: Implement numbers and per-page**

In `src/widgets/pagination.tsx`, make exactly these edits:

1. Extend the props interface:

```tsx
  /** Honest page-size options; the select renders only with `onPageSizeChange`. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
```

2. Destructure both in the component signature (no defaults).

3. Add the page-list builder above the component:

```tsx
/** Page buttons with an ellipsis for long ranges. Never invents a page. */
function pageNumbers(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const window = [page - 1, page, page + 1].filter((n) => n > 1 && n < pageCount);
  const unique = [...new Set([1, ...window, pageCount])].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (const [index, value] of unique.entries()) {
    if (index > 0 && value - unique[index - 1]! > 1) out.push("…");
    out.push(value);
  }
  return out;
}
```

4. Compute `const numbers = pageNumbers(safePage, pageCount);` after the existing `safePage` computation.

5. Restructure the controls row. Replace:

```tsx
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
          Page {safePage} of {pageCount}
        </span>
        <div className="d-flex gap-2">
```

with:

```tsx
      <div className="d-flex flex-wrap align-items-center gap-3">
        <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
          Page {safePage} of {pageCount}
        </span>
        {onPageSizeChange && pageSizeOptions ? (
          <label className="pager-perpage text-muted small">
            Rows per page{" "}
            <select
              className="form-select form-select-sm d-inline-block w-auto"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="d-flex flex-wrap align-items-center gap-1">
```

6. Insert the numbered buttons between the Previous button and the Next button. The existing Previous button block ends with `</Button>` followed by the Next `<Button`. Replace:

```tsx
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={safePage >= pageCount}
            onClick={() => onPage(safePage + 1)}
          >
```

with:

```tsx
          {numbers.map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="text-muted small px-1" aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === safePage ? "primary" : "outline-secondary"}
                size="sm"
                disabled={item === safePage}
                aria-label={`Go to page ${item}`}
                aria-current={item === safePage ? "page" : undefined}
                onClick={() => onPage(item)}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={safePage >= pageCount}
            onClick={() => onPage(safePage + 1)}
          >
```

(The `key={`gap-${index}`}` form satisfies the no-array-index-key lint posture used in this repo: the key carries the item kind, and gaps are stable per render.)

7. Append the pager style to `src/styles/_user.scss`:

```scss
.pager-perpage {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
```

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run src/widgets/pagination-numbers.test.tsx` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean (the existing pager assertions on range text and "Page N of M" still hold).

- [ ] **Step 5: Commit**

```bash
git add src/widgets/pagination.tsx src/widgets/pagination-numbers.test.tsx src/styles/_user.scss
git commit -m "feat: add page numbers and page sizing to pagination"
```

---

### Task 8: Feel styles (sticky header, row states)

**Files:**
- Modify: `src/widgets/data-table.tsx` (add the `data-table` class to both `Table` renders)
- Modify: `src/styles/_user.scss` (append sticky/hover/selected rules)
- Test: `src/styles/surfaces.test.ts`

**Interfaces:**
- Consumes: `.shopee-card`, `--shopee-*` tokens.
- Produces: the `.data-table` class contract — sticky `thead` on desktop, hover wash, selected-row tint. Later tasks rely on nothing new.

- [ ] **Step 1: Write the failing test**

Create `src/styles/surfaces.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scss = readFileSync(resolve(__dirname, "_user.scss"), "utf8");

describe("list surface styles", () => {
  it("sticks the table header below the topbar on desktop", () => {
    expect(scss).toContain(".data-table thead th");
    expect(scss).toContain("top: 3.5rem");
    expect(scss).toContain("@media (min-width: 768px)");
  });

  it("paints hover and selected rows from the primary token", () => {
    expect(scss).toContain('tr[data-selected="true"]');
    expect(scss).toContain("var(--shopee-primary-soft)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/styles/surfaces.test.ts`
Expected: FAIL — `.data-table` does not exist yet.

- [ ] **Step 3: Add the class and the styles**

1. In `src/widgets/data-table.tsx`, add `data-table` to both `Table` renders (loading skeleton and ready table):

```tsx
<Table responsive className="data-table align-middle mb-0 text-nowrap">
```

(There are exactly two occurrences; change both.)

2. Append to `src/styles/_user.scss`:

```scss
@media (min-width: 768px) {
  .data-table thead th {
    position: sticky;
    top: 3.5rem;
    z-index: 10;
    background-color: $gray-100;
  }
}

.data-table tbody > tr:hover > * {
  background-color: var(--shopee-primary-soft);
}

.data-table tbody > tr[data-selected="true"] > * {
  background-color: var(--shopee-primary-soft);
}

.data-table tbody > tr:focus-within {
  outline: 2px solid var(--shopee-primary);
  outline-offset: -2px;
}
```

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run src/styles/surfaces.test.ts` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/data-table.tsx src/styles/surfaces.test.ts src/styles/_user.scss
git commit -m "style: add sticky header and row states to tables"
```

---

### Task 9: Products bulk runner

**Files:**
- Modify: `src/features/products/mutations.ts` (append the bulk runner after `useUnpublishProductMutation`, before the Variants section)
- Test: `src/features/products/bulk-status.test.ts`

**Interfaces:**
- Consumes: `publishProduct`, `unpublishProduct` from `./api`; `productsKeys` from `./queries`.
- Produces: `BulkStatusAction = "publish" | "unpublish"`; `BulkStatusResult { id: string; ok: boolean; message?: string }`; `useBulkProductStatusMutation()` returning a mutation whose `mutateAsync({ ids, action })` resolves to one `BulkStatusResult` per id in input order and invalidates `productsKeys.all` once everything settles.

- [ ] **Step 1: Write the failing test**

Create `src/features/products/bulk-status.test.ts`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publishProduct, unpublishProduct } from "features/products/api";
import { useBulkProductStatusMutation } from "features/products/mutations";
import { productsKeys } from "features/products/queries";

vi.mock("features/products/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("features/products/api")>()),
  publishProduct: vi.fn(),
  unpublishProduct: vi.fn(),
}));

function harness() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

describe("bulk product status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes every id and reports per-id results", async () => {
    const { invalidate, wrapper } = harness();
    vi.mocked(publishProduct).mockResolvedValue({ id: "a" } as never);

    const { result } = renderHook(() => useBulkProductStatusMutation(), { wrapper });
    const results = await result.current.mutateAsync({ ids: ["a", "b"], action: "publish" });

    expect(results).toEqual([
      { id: "a", ok: true },
      { id: "b", ok: true },
    ]);
    expect(publishProduct).toHaveBeenCalledTimes(2);
    expect(publishProduct).toHaveBeenNthCalledWith(1, "a");
    expect(publishProduct).toHaveBeenNthCalledWith(2, "b");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.all });
  });

  it("collects failures with the backend message instead of throwing", async () => {
    const { wrapper } = harness();
    vi.mocked(publishProduct)
      .mockResolvedValueOnce({ id: "a" } as never)
      .mockRejectedValueOnce(new Error("No active variant"));

    const { result } = renderHook(() => useBulkProductStatusMutation(), { wrapper });
    const results = await result.current.mutateAsync({ ids: ["a", "b"], action: "publish" });

    expect(results).toEqual([
      { id: "a", ok: true },
      { id: "b", ok: false, message: "No active variant" },
    ]);
  });

  it("unpublishes through the unpublish endpoint", async () => {
    const { wrapper } = harness();
    vi.mocked(unpublishProduct).mockResolvedValue({ id: "a" } as never);

    const { result } = renderHook(() => useBulkProductStatusMutation(), { wrapper });
    const results = await result.current.mutateAsync({ ids: ["a"], action: "unpublish" });

    expect(results).toEqual([{ id: "a", ok: true }]);
    expect(unpublishProduct).toHaveBeenCalledWith("a");
    expect(publishProduct).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/products/bulk-status.test.ts`
Expected: FAIL — `useBulkProductStatusMutation` is not exported.

- [ ] **Step 3: Implement the bulk runner**

In `src/features/products/mutations.ts`, insert after `useUnpublishProductMutation` (before the Variants section header):

```ts
export type BulkStatusAction = "publish" | "unpublish";

export interface BulkStatusResult {
  id: string;
  ok: boolean;
  message?: string;
}

/**
 * Publish or unpublish many products at once.
 *
 * One settled result per id, in input order: a refusal for one row never cancels the
 * rest, and the caller decides what the summary says. The list is invalidated once,
 * after every request settles, because per-row optimistic writes would fight each other.
 */
export function useBulkProductStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      action,
    }: {
      ids: string[];
      action: BulkStatusAction;
    }): Promise<BulkStatusResult[]> => {
      const run = action === "publish" ? publishProduct : unpublishProduct;
      const settled = await Promise.allSettled(ids.map((id) => run(id)));
      return settled.map((result, index) => {
        const id = ids[index] ?? "";
        if (result.status === "fulfilled") return { id, ok: true };
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : "The product could not be updated.";
        return { id, ok: false, message };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}
```

(No new imports: `publishProduct`, `unpublishProduct`, `productsKeys`, `useMutation`, and `useQueryClient` are already imported in this file.)

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run src/features/products/bulk-status.test.ts` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/products/mutations.ts src/features/products/bulk-status.test.ts
git commit -m "feat: add bulk publish and unpublish runner"
```

---

### Task 10: Products page adoption

**Files:**
- Modify: `src/features/products/components/products-table.tsx` (add `mobile` mapping per column)
- Modify: `src/features/products/components/products-page.tsx` (tabs, selection, bulk bar, summary, pager upgrade)
- Modify: `tests/integration/product-order-pages.test.tsx` (rewrite the tabs case, add bulk + per-page cases, add the `api` mock and fixtures)

**Interfaces:**
- Consumes: `SegmentedControl`, `BulkBar`, `useBulkProductStatusMutation`, `BulkStatusAction`, upgraded `DataTable`/`Pagination`.
- Produces: no new exports; the page keeps its URL contract (`status`, `page`, `pageSize`).

- [ ] **Step 1: Write the new failing tests and rewrite the tabs case**

In `tests/integration/product-order-pages.test.tsx`, make exactly these edits:

1. Add the `api` mock after the existing imports (it preserves every export except the two bulk endpoints, so list fetching keeps working):

```tsx
import { publishProduct, unpublishProduct } from "features/products/api";

vi.mock("features/products/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("features/products/api")>()),
  publishProduct: vi.fn(),
  unpublishProduct: vi.fn(),
}));
```

2. Add the fixtures after `ONE_PAGE`:

```tsx
const SECOND_ID = "55555555-5555-4555-8555-555555555555";
const SECOND_SUMMARY = {
  ...SUMMARY,
  id: SECOND_ID,
  name: "Second Lamp",
  status: "active" as const,
};
const TWO_PAGE = { items: [SUMMARY, SECOND_SUMMARY], total: 2, page: 1, page_size: 20 };
const writerSession = {
  ...sessionFixture,
  permissions: [...sessionFixture.permissions, "products:write"],
};
```

3. Rewrite the "writes a status change back into the URL" case to use the tabs:

```tsx
  it("writes a status change back into the URL rather than keeping it in memory", async () => {
    stubList({ status_code: 200, message: "Success", data: EMPTY_PAGE });
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<ProductsPage />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("radio", { name: "Active" }));

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("status=active");
  });
```

4. Extend the "reads the status filter out of the URL" case with one checked-tab assertion (append after the existing `expect` lines):

```tsx
    expect(await screen.findByRole("radio", { name: "Active" })).toBeChecked();
```

5. Append the bulk and per-page cases at the end of `describe("products page", ...)` (before its closing `});`):

```tsx
  it("publishes the selected rows and clears the selection", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });
    vi.mocked(publishProduct).mockResolvedValue({ id: PRODUCT_ID } as never);
    const user = userEvent.setup();

    renderWithProviders(<ProductsPage />, { session: writerSession });
    await screen.findByText("Cloudline Pendant");

    await user.click(screen.getByRole("checkbox", { name: /select row/i }));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(publishProduct).toHaveBeenCalledWith(PRODUCT_ID));
    await waitFor(() =>
      expect(screen.queryByText(/1 product selected/i)).not.toBeInTheDocument(),
    );
  });

  it("names the rows a bulk run fails on and retries only them", async () => {
    stubList({ status_code: 200, message: "Success", data: TWO_PAGE });
    vi.mocked(publishProduct).mockImplementation((id: string) =>
      id === PRODUCT_ID
        ? Promise.resolve({ id } as never)
        : Promise.reject(new Error("No active variant")),
    );
    const user = userEvent.setup();

    renderWithProviders(<ProductsPage />, { session: writerSession });
    await screen.findByText("Cloudline Pendant");

    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await screen.findByText(/published 1 of 2/i);
    expect(screen.getByText(/second lamp/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry failed/i }));
    await waitFor(() => expect(vi.mocked(publishProduct)).toHaveBeenCalledTimes(3));
    expect(vi.mocked(publishProduct).mock.calls.at(-1)?.[0]).toBe(SECOND_ID);
  });

  it("writes a page-size change back into the URL and resets to page one", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<ProductsPage />, { session: sessionFixture });
    await screen.findByText("Cloudline Pendant");

    await userEvent.selectOptions(screen.getByLabelText(/rows per page/i), "50");

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("pageSize=50");
    expect(url).toContain("page=1");
  });
```

- [ ] **Step 2: Run tests to verify the new behavior is missing**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx`
Expected: FAIL — no `radio` named "Active", no row checkboxes, no "Publish" button, no "Rows per page" select.

- [ ] **Step 3: Add mobile mapping to the product columns**

In `src/features/products/components/products-table.tsx`, add a `mobile` field to each column in `productColumns`:

- product column: add `mobile: { label: "Product" },` after `skeletonWidth: 160,`
- category column: add `mobile: { label: "Category" },` after `skeletonWidth: 80,`
- brand column: add `mobile: { hide: true },` after `skeletonWidth: 64,`
- status column: add `mobile: { label: "Status" },` after `skeletonWidth: 72,`
- updated column: add `mobile: { label: "Updated" },` after `skeletonWidth: 84,`
- actions column: add `mobile: {},` after `skeletonWidth: 60,`

- [ ] **Step 4: Replace the filter select with segmented tabs**

In `src/features/products/components/products-page.tsx`, replace the whole `FilterBar` children block (the `<div style={{ minWidth: 220 }}>` select) with tabs. Old string (exact):

```tsx
        <FilterBar
          onReset={
            filters.status
              ? () => updateQuery({ status: undefined, page: undefined })
              : undefined
          }
        >
          <div style={{ minWidth: 220 }}>
            <Form.Label htmlFor="product-status-filter" className="visually-hidden">
              Filter by status
            </Form.Label>
            <Form.Select
              id="product-status-filter"
              value={filters.status ?? ""}
              onChange={(event) =>
                updateQuery({ status: event.target.value || undefined, page: "1" })
              }
              aria-label="Filter products by status"
            >
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {productStatusLabel(value)}
                </option>
              ))}
            </Form.Select>
          </div>
        </FilterBar>
```

New string:

```tsx
        <FilterBar
          onReset={
            filters.status
              ? () => updateQuery({ status: undefined, page: undefined })
              : undefined
          }
        >
          <SegmentedControl
            label="Filter by status"
            name="product-status"
            options={[
              { value: "", label: "All" },
              ...PRODUCT_STATUSES.map((value) => ({ value, label: productStatusLabel(value) })),
            ]}
            value={filters.status ?? ""}
            onChange={(next) => updateQuery({ status: next || undefined, page: "1" })}
          />
        </FilterBar>
```

- [ ] **Step 5: Wire selection, bulk state, and the bulk runner**

In `src/features/products/components/products-page.tsx`, insert the following block immediately before the line `  const failure = products.error;` (exact anchor, appears once):

```tsx
  const listKey = `${filters.status ?? ""}|${filters.page}|${filters.pageSize}`;
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkReport, setBulkReport] = useState<{
    action: BulkStatusAction;
    succeeded: number;
    failures: { id: string; name: string; message: string }[];
  } | null>(null);

  useEffect(() => {
    setSelected([]);
    setBulkReport(null);
  }, [listKey]);

  const bulk = useBulkProductStatusMutation();
  const names = new Map((page?.items ?? []).map((product) => [product.id, product.name]));

  async function runBulk(action: BulkStatusAction, ids: string[]) {
    setBulkReport(null);
    const results = await bulk.mutateAsync({ ids, action });
    const failures = results.filter((result) => !result.ok);
    if (failures.length === 0) setSelected([]);
    setBulkReport({
      action,
      succeeded: results.length - failures.length,
      failures: failures.map((failure) => ({
        id: failure.id,
        name: names.get(failure.id) ?? failure.id,
        message: failure.message ?? "The product could not be updated.",
      })),
    });
  }

```

Next, replace the `DataTable` element (exact old string):

```tsx
          <DataTable
            columns={productColumns({ categoryNames, brandNames, canWrite })}
            rows={page?.items ?? []}
            getRowKey={(product) => product.id}
            isLoading={products.isPending}
            errorMessage={errorMessage}
            onRetry={() => void products.refetch()}
            emptyState={<ProductsEmptyState canWrite={canWrite} />}
          />
```

with:

```tsx
          {bulkReport && bulkReport.failures.length > 0 ? (
            <div className="px-4 py-3 border-bottom" role="alert">
              <p className="mb-1 fw-semibold text-danger">
                {bulkReport.action === "publish" ? "Published" : "Unpublished"}{" "}
                {bulkReport.succeeded} of {bulkReport.succeeded + bulkReport.failures.length} —{" "}
                {bulkReport.failures.length} failed:
              </p>
              <ul className="mb-2 small">
                {bulkReport.failures.map((failure) => (
                  <li key={failure.id}>
                    {failure.name} — {failure.message}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={bulk.isPending}
                onClick={() =>
                  void runBulk(
                    bulkReport.action,
                    bulkReport.failures.map((failure) => failure.id),
                  )
                }
              >
                Retry failed
              </Button>
            </div>
          ) : null}
          {canWrite && selected.length > 0 ? (
            <BulkBar
              countLabel={`${selected.length} ${selected.length === 1 ? "product" : "products"} selected`}
              actions={[
                {
                  id: "publish",
                  label: "Publish",
                  icon: <Check size={14} aria-hidden="true" />,
                  variant: "primary",
                },
                {
                  id: "unpublish",
                  label: "Unpublish",
                  icon: <EyeOff size={14} aria-hidden="true" />,
                },
              ]}
              onAction={(id) => void runBulk(id as BulkStatusAction, selected)}
              onClear={() => setSelected([])}
              isPending={bulk.isPending}
            />
          ) : null}
          <DataTable
            columns={productColumns({ categoryNames, brandNames, canWrite })}
            rows={page?.items ?? []}
            getRowKey={(product) => product.id}
            isLoading={products.isPending}
            errorMessage={errorMessage}
            onRetry={() => void products.refetch()}
            emptyState={<ProductsEmptyState canWrite={canWrite} />}
            selectedKeys={canWrite ? selected : undefined}
            onSelectionChange={canWrite ? setSelected : undefined}
          />
```

- [ ] **Step 6: Extend the pager and update the page imports**

1. In `src/features/products/components/products-page.tsx`, replace the `Pagination` element (exact old string):

```tsx
          {!products.isError && page && page.items.length > 0 ? (
            <Pagination
              page={page.page}
              pageSize={page.page_size}
              total={page.total}
              onPage={goToPage}
              itemLabel="products"
            />
          ) : null}
```

with:

```tsx
          {!products.isError && page && page.items.length > 0 ? (
            <Pagination
              page={page.page}
              pageSize={page.page_size}
              total={page.total}
              onPage={goToPage}
              itemLabel="products"
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={(size) => updateQuery({ pageSize: String(size), page: "1" })}
            />
          ) : null}
```

2. Update the imports of the same file with four exact edits:

```tsx
import { useEffect, useState } from "react";
```

(insert as a new line after the `next/navigation` import line)

```tsx
import { Button, Card, Col, Row } from "react-bootstrap";
```

(replaces `import { Card, Col, Form, Row } from "react-bootstrap";`)

```tsx
import { Check, EyeOff, Plus } from "react-feather";
```

(replaces `import { Plus } from "react-feather";`)

```tsx
import BulkBar from "widgets/bulk-bar";
import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import SegmentedControl from "widgets/segmented-control";
import StatCard from "widgets/stat-card";
```

(replaces the six-line widget import block, inserting `BulkBar` first and `SegmentedControl` after `Pagination`)

```tsx
import { useBulkProductStatusMutation, type BulkStatusAction } from "features/products/mutations";
```

(insert as a new line after the `features/products/mapping` import line)

- [ ] **Step 7: Run tests and gates**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx tests/integration/empty-states.test.tsx` — Expected: PASS (rewritten tabs case, bulk success + partial + retry, per-page case, plus all pre-existing cases).
Run: `pnpm run test` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/features/products/components/products-table.tsx src/features/products/components/products-page.tsx tests/integration/product-order-pages.test.tsx
git commit -m "feat: adopt upgraded list surfaces on the products page"
```

---

### Task 11: Orders page adoption

**Files:**
- Modify: `src/features/orders/components/orders-table.tsx` (sortable flags, mobile mapping, delete `SortButton`)
- Modify: `src/features/orders/components/orders-page.tsx` (tabs, chips, sort select, pager upgrade, page-size handler)
- Test: `tests/integration/product-order-pages.test.tsx` (append orders cases)

**Interfaces:**
- Consumes: `SegmentedControl`, `FilterChips`, upgraded `DataTable`/`Pagination`; `OrderSort`, `OrderSortKey`, `SortDirection` stay in `orders-table.tsx`.
- Produces: no new exports; the page keeps its URL contract (`search`, `status`, `page`, `pageSize`) and sort stays local.

- [ ] **Step 1: Write the new failing tests**

Append to `describe("orders page", ...)` in `tests/integration/product-order-pages.test.tsx`:

```tsx
  it("writes a status tab change back into the URL", async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("radio", { name: "Completed" }));

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("status=completed");
  });

  it("removes the search chip and clears the query", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("search=ord") as never);
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    expect(
      screen.getByRole("button", { name: "Remove Search filter: ord" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove Search filter: ord" }));

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).not.toContain("search");
  });

  it("toggles the sort direction on a sortable column", async () => {
    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    const total = screen.getByRole("columnheader", { name: /total/i });
    expect(total).toHaveAttribute("aria-sort", "none");

    await userEvent.click(screen.getByRole("button", { name: "Sort by Total" }));
    expect(screen.getByRole("columnheader", { name: /total/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await userEvent.click(screen.getByRole("button", { name: "Sort by Total" }));
    expect(screen.getByRole("columnheader", { name: /total/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("writes a page-size change back into the URL and resets to page one", async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    await userEvent.selectOptions(screen.getByLabelText(/rows per page/i), "10");

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("pageSize=10");
    expect(url).toContain("page=1");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx`
Expected: FAIL — no `radio` named "Completed", no search chip, no "Sort by Total" button, no "Rows per page" select.

- [ ] **Step 3: Convert the order columns to the sorting API**

In `src/features/orders/components/orders-table.tsx`, make exactly these edits:

1. Replace the feather import line:

```tsx
import { Eye, ShoppingBag } from "react-feather";
```

(replaces `import { ChevronDown, ChevronUp, ChevronsDown, Eye, ShoppingBag } from "react-feather";`)

2. Delete the entire `SortButton` block (from the `/** Sort control ... */` comment through its closing `}` before `function formatPrice`).

3. In `orderColumns`, replace the four sortable headers and add flags plus mobile mapping on every column:

```tsx
    {
      id: "reference",
      header: "Order",
      sortable: true,
      width: "24%",
      skeletonWidth: 110,
      mobile: { label: "Order" },
```

(replaces the `id: "reference"` block's `header: <SortButton ... />,` line with `header: "Order",` + `sortable: true,` and adds the `mobile` line after `skeletonWidth: 110,`)

```tsx
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      width: "24%",
      skeletonWidth: 100,
      mobile: { label: "Customer" },
```

```tsx
    {
      id: "items",
      header: "Items",
      skeletonWidth: 45,
      mobile: { label: "Items" },
```

```tsx
    {
      id: "total",
      header: "Total",
      sortable: true,
      skeletonWidth: 65,
      mobile: { label: "Total" },
```

```tsx
    {
      id: "status",
      header: "Status",
      skeletonWidth: 76,
      mobile: { label: "Status" },
```

```tsx
    {
      id: "placed",
      header: "Placed",
      sortable: true,
      sortKey: "placedAt",
      skeletonWidth: 90,
      mobile: { label: "Placed" },
```

```tsx
    {
      id: "actions",
      header: "Actions",
      align: "end",
      skeletonWidth: 28,
      mobile: {},
```

(Each replaces the corresponding `header: <SortButton ... />` or plain header block minimally: swap the header line, insert `sortable`/`sortKey`/`mobile` lines. The `status`, `items`, and `actions` headers stay plain text.)

- [ ] **Step 4: Rewrite the orders filter, sort, and pager wiring**

In `src/features/orders/components/orders-page.tsx`, make exactly these edits:

1. Extend the widget imports:

```tsx
import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import FilterChips from "widgets/filter-chips";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import SegmentedControl from "widgets/segmented-control";
import StatCard from "widgets/stat-card";
```

(replaces the five-line widget import block, inserting `FilterChips` and `SegmentedControl`)

2. Extend the orders-table import with the direction type:

```tsx
import { OrdersEmptyState, OrderStatusBadge, orderColumns, type OrderSort, type OrderSortKey, type SortDirection } from "features/orders/components/orders-table";
```

(replaces the existing single-line import)

3. Add the page-size handler after `goToPage`:

```tsx
  function updatePageSize(size: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(size));
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
```

4. Replace the status select block (exact old string):

```tsx
          <div style={{ minWidth: 180 }}>
            <label htmlFor="order-status-filter" className="visually-hidden">Filter by status</label>
            <select
              id="order-status-filter"
              className="form-select form-select-sm"
              value={status}
              onChange={(event) => updateStatus(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </FilterBar>
```

with:

```tsx
          <SegmentedControl
            label="Filter by status"
            name="order-status"
            options={[
              { value: "all", label: "All" },
              { value: "completed", label: "Completed" },
              { value: "processing", label: "Processing" },
              { value: "pending", label: "Pending" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={status}
            onChange={updateStatus}
          />
        </FilterBar>
        <FilterChips
          chips={search.trim() ? [{ id: "search", label: "Search", value: search.trim() }] : []}
          onRemove={(id) => {
            if (id === "search") updateSearch("");
          }}
          onClearAll={resetFilters}
        />
        <div className="d-md-none px-4 pt-3">
          <label htmlFor="order-sort" className="visually-hidden">
            Sort orders
          </label>
          <select
            id="order-sort"
            className="form-select form-select-sm"
            value={`${sort.key}-${sort.direction}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split("-") as [
                OrderSortKey,
                SortDirection,
              ];
              setSort({ key, direction });
            }}
          >
            <option value="placedAt-desc">Newest first</option>
            <option value="placedAt-asc">Oldest first</option>
            <option value="total-desc">Total: high to low</option>
            <option value="total-asc">Total: low to high</option>
          </select>
        </div>
```

5. Pass sorting to the table (exact old string):

```tsx
        <DataTable
          columns={orderColumns({ sort, onSort: toggleSort, onView: setSelectedOrder })}
```

new string:

```tsx
        <DataTable
          columns={orderColumns({ sort, onSort: toggleSort, onView: setSelectedOrder })}
          sort={{ key: sort.key, direction: sort.direction }}
          onSortChange={(key) => toggleSort(key as OrderSortKey)}
```

6. Extend the pager (exact old string):

```tsx
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPage={goToPage}
            itemLabel="orders"
          />
```

new string:

```tsx
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPage={goToPage}
            itemLabel="orders"
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={updatePageSize}
          />
```

- [ ] **Step 5: Run tests and gates**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx` — Expected: PASS (new tabs, chips, sort, and per-page cases plus the pre-existing heading, stats, search, and drawer cases).
Run: `pnpm run test` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/features/orders/components/orders-table.tsx src/features/orders/components/orders-page.tsx tests/integration/product-order-pages.test.tsx
git commit -m "feat: adopt upgraded list surfaces on the orders page"
```

---

### Task 12: Verification pass

**Files:** none (verification only; fixes land as small follow-up commits).

- [ ] **Step 1: Run all four gates**

Run: `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`
Expected: all green. Fix failures before continuing.

- [ ] **Step 2: Dev-server smoke**

Start `pnpm dev` (or reuse the running server for this directory) and request `/products`, `/orders`, `/products/new`, and `/login`. Expected: HTTP 200 with no terminal compilation errors.

- [ ] **Step 3: Batched visual pass (one batch, one confirm round)**

Authenticated session required (the route guard redirects session-less traffic to `/login`). Check desktop (1440) and mobile (375): sticky table header under the topbar, tabs and chips, bulk bar with partial-failure summary, numbered pagination with per-page sizing, mobile card lists with the sort select, skeleton states, and `prefers-reduced-motion`. Log every defect in one list, fix in one batch, re-check only the fixed items, then stop.

- [ ] **Step 4: Record and push**

Append the outcome (gates output summary + defects found/fixed) under a `## Verification record` section at the end of `docs/superpowers/plans/2026-10-07-cms-list-upgrade.md`, commit it, and push the branch once:

```bash
git push
```

---

## Verification record

Executed 2026-10-07 (Task 12).

- Gates: `pnpm run lint` exit 0; `pnpm run typecheck` clean; `pnpm run test` 236/236 (30 files); `pnpm run build` success.
- Smoke: the running dev server for this directory (port 3000) returned 200 for `/`, `/products`, `/orders`, `/products/new`, `/login`.
- Authenticated visual pass (sticky header, tabs, chips, bulk bar with partial-failure summary, numbered pagination, per-page sizing, mobile cards, skeletons, reduced motion): parked for the signed-in human; the route guard redirects session-less traffic to `/login`.
- Reviews: twelve task reviews clean (Task 1 one fix round for the token substitution; Task 11 one fix round for mobile sort options); two brief-level defects caught and corrected during execution (radio accessible names, helper placement order, JSX in `.ts` test).
- Still open (parked, not fixed): dead `sort`/`onSort` params on `orderColumns` (signature + call site must change together); orders empty-state copy under active filters; minor test-coverage polish; authenticated visual pass.

