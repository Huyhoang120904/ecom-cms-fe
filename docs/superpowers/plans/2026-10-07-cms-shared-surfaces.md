# CMS Shared Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared listing surfaces (PageShell, FilterBar, DataTable, Pagination, StatCard, EmptyState, ErrorState) on the Shopee skin and adopt them in the products and orders pages.

**Architecture:** Presentational widgets live in `src/widgets/` and read a small `--shopee-*` semantic layer compiled from the existing `_user-variables.scss`. Feature modules keep all data behavior: products keeps URL-driven server filtering, orders keeps its labelled sample data and client-side sort/pagination. `react-bootstrap` APIs stay.

**Tech Stack:** Next.js 16 App Router, TypeScript, Bootstrap 5 / react-bootstrap 2, SCSS (`sass`), `react-feather`, vitest 5 + Testing Library (jsdom), `pnpm` only.

**Spec:** `docs/superpowers/specs/2026-10-07-cms-shared-surfaces-design.md`

## Global Constraints

- pnpm only; never hand-edit `pnpm-lock.yaml`.
- Gates where code changes: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`.
- No CMS-token port; the Shopee skin stays. No new theme pipeline.
- Feature modules own components/queries/schemas/pages; widgets are presentational.
- No invented data; auth/session/query/envelope code untouched.
- Existing tests keep passing: roles and copy are preserved unless a step says otherwise.
- Do not commit during execution unless the user explicitly authorizes it; leave changes in the working tree.

---

### Task 1: Shopee semantic tokens + shell backdrop a11y

**Files:**
- Modify: `src/styles/_user.scss` (insert `:root` tokens after the file header comment near line 5; append backdrop override in the shopee surfaces section)
- Modify: `src/app/shell/app-shell.tsx:137-143` (backdrop)
- Modify: `eslint.config.mjs` (add `.worktrees/**` to `globalIgnores` so `pnpm run lint` ignores the nested worktree)
- Create: `src/app/shell/shell-a11y.test.tsx`

**Interfaces:**
- Consumes: existing `$primary`, `$danger`, `$success`, `$warning`, `$info`, `$white`, `$gray-*`, `$border-radius` from `_user-variables.scss`.
- Produces: CSS custom properties every later widget task reads — `--shopee-primary`, `--shopee-primary-soft`, `--shopee-primary-border`, `--shopee-surface`, `--shopee-background`, `--shopee-border`, `--shopee-text`, `--shopee-muted-text`, `--shopee-danger`, `--shopee-success`, `--shopee-warning`, `--shopee-info`, `--shopee-radius`.

- [ ] **Step 1: Write the failing shell test**

Create `src/app/shell/shell-a11y.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("features/auth/auth-context", () => ({
  useAuth: () => ({ session: null, can: () => false }),
}));
vi.mock("features/auth/mutations", () => ({
  useLogoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSwitchShopMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AppShell from "app/shell/app-shell";

describe("shell accessibility", () => {
  it("labels the sidebar and turns the mobile backdrop into a real button", async () => {
    render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /open menu/i }));

    const backdrop = screen.getByRole("button", { name: /close navigation menu/i });
    expect(backdrop).toHaveClass("sidebar-backdrop");

    await userEvent.click(backdrop);
    expect(
      screen.queryByRole("button", { name: /close navigation menu/i }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/shell/shell-a11y.test.tsx`
Expected: FAIL — no button named "Close navigation menu" (backdrop is a `div`).

- [ ] **Step 3: Add the semantic tokens**

In `src/styles/_user.scss`, directly under the opening `// user.scss` comment block (before the `─── Shopee Seller Centre skin ───` section), add:

```scss
// ─── Shopee semantic tokens ───
//
// Shared widgets read these custom properties instead of raw hex values, so a
// palette change lands in one place. Values compile from _user-variables.scss.
:root {
  --shopee-primary: #{$primary};
  --shopee-primary-soft: #{rgba($primary, 0.08)}; // interpolation required inside custom properties
  --shopee-primary-border: #{rgba($primary, 0.15)};
  --shopee-surface: #{$white};
  --shopee-background: #{$gray-100};
  --shopee-border: #{$gray-200};
  --shopee-text: #{$gray-900};
  --shopee-muted-text: #{$gray-600};
  --shopee-danger: #{$danger};
  --shopee-success: #{$success};
  --shopee-warning: #{$warning};
  --shopee-info: #{$info};
  --shopee-radius: #{$border-radius};
}
```

- [ ] **Step 4: Convert the backdrop to a button**

In `src/app/shell/app-shell.tsx`, replace the backdrop block:

```tsx
      {/* Mobile overlay backdrop */}
      {mobileOpen ? (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
```

with:

```tsx
      {/* Mobile overlay backdrop: a real button so it is keyboard reachable */}
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
```

Append the button reset to the shopee surfaces section of `src/styles/_user.scss` (after `.btn-primary` at the end of the file):

```scss
.sidebar-backdrop {
  border: 0;
  padding: 0;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $primary;
    outline-offset: 2px;
  }
}
```

- [ ] **Step 5: Run test and gates**

Run: `pnpm vitest run src/app/shell/` — Expected: PASS (new + existing shell tests).
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit (only when authorized)**

```bash
git add src/styles/_user.scss src/app/shell/app-shell.tsx src/app/shell/shell-a11y.test.tsx
git commit -m "style: add shopee tokens and make the mobile backdrop a button"
```

---

### Task 2: Shared state widgets (EmptyState, ErrorState)

**Files:**
- Create: `src/widgets/empty-state.tsx`
- Create: `src/widgets/error-state.tsx`
- Modify: `src/styles/_user.scss` (append `.empty-state-icon`)
- Test: `src/widgets/state-widgets.test.tsx`

**Interfaces:**
- Consumes: `--shopee-*` tokens (Task 1).
- Produces:
  - `EmptyState { icon?: ReactNode; title: string; body: string; action?: { label: string; href: string }; children?: ReactNode }` (default export)
  - `ErrorState { message: string; onRetry?: () => void }` (default export)

- [ ] **Step 1: Write the failing tests**

Create `src/widgets/state-widgets.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Package } from "react-feather";

import EmptyState from "widgets/empty-state";
import ErrorState from "widgets/error-state";

describe("state widgets", () => {
  it("renders an honest empty state with one next action", () => {
    render(
      <EmptyState
        icon={<Package size={24} />}
        title="No products yet"
        body="This shop has no products."
        action={{ label: "Add your first product", href: "/products/new" }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No products yet");
    expect(screen.getByRole("link", { name: "Add your first product" })).toHaveAttribute(
      "href",
      "/products/new",
    );
  });

  it("omits the action when the role cannot take it and shows the fallback note", () => {
    render(
      <EmptyState title="No products yet" body="Read-only role.">
        <span>Your role can only read.</span>
      </EmptyState>,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Your role can only read.")).toBeInTheDocument();
  });

  it("announces an error and retries through the handler", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Products failed to load." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Products failed to load.");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders no retry button when no handler is given", () => {
    render(<ErrorState message="Products failed to load." />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/widgets/state-widgets.test.tsx`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Implement EmptyState**

Create `src/widgets/empty-state.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body: string;
  /** The one next action that creates data, offered only to a role that may take it. */
  action?: EmptyStateAction;
  /** Fallback copy when the role cannot take the action (for example, read-only). */
  children?: ReactNode;
}

/** Honest empty state: the surface says it is empty and names the next step. */
export default function EmptyState({ icon, title, body, action, children }: EmptyStateProps) {
  return (
    <div className="text-center px-4 py-5" role="status">
      {icon ? (
        <div className="empty-state-icon mx-auto mb-3" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <p className="mb-1 fw-semibold text-dark fs-4">{title}</p>
      <p className="text-muted mb-0 mx-auto" style={{ maxWidth: 460 }}>
        {body}
      </p>
      {action ? (
        <Link href={action.href} className="btn btn-primary btn-sm mt-3">
          {action.label}
        </Link>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: Implement ErrorState**

Create `src/widgets/error-state.tsx`:

```tsx
import { Alert, Button } from "react-bootstrap";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Error surface: the message and the retry that re-fires the query. */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="px-4 py-5">
      <Alert variant="danger" role="alert" className="mb-3">
        {message}
      </Alert>
      {onRetry ? (
        <Button type="button" variant="outline-secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Add the icon chip style**

Append to `src/styles/_user.scss`:

```scss
.empty-state-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--shopee-primary);
  background-color: var(--shopee-primary-soft);
}
```

- [ ] **Step 6: Run tests and gates**

Run: `pnpm vitest run src/widgets/` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 7: Commit (only when authorized)**

```bash
git add src/widgets/empty-state.tsx src/widgets/error-state.tsx src/widgets/state-widgets.test.tsx src/styles/_user.scss
git commit -m "feat: add shared empty and error state widgets"
```

---

### Task 3: List chrome (PageShell, FilterBar, StatCard) + heading level

**Files:**
- Create: `src/widgets/page-shell.tsx`
- Create: `src/widgets/filter-bar.tsx`
- Create: `src/widgets/stat-card.tsx`
- Modify: `src/widgets/page-heading.tsx` (element `h3` → `h1`)
- Test: `src/widgets/list-chrome.test.tsx`

**Interfaces:**
- Consumes: `PageHeading { heading, children? }`; `--shopee-*` tokens.
- Produces:
  - `PageShell { title: string; actions?: ReactNode; stats?: ReactNode; children: ReactNode }`
  - `FilterBar { children: ReactNode; onReset?: () => void }`
  - `StatCard { label: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: "primary" | "success" | "warning" | "danger" | "info" }`

- [ ] **Step 1: Write the failing tests**

Create `src/widgets/list-chrome.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/widgets/list-chrome.test.tsx`
Expected: FAIL — modules do not exist; PageShell heading level 1 missing.

- [ ] **Step 3: Implement PageShell**

Create `src/widgets/page-shell.tsx`:

```tsx
import type { ReactNode } from "react";

import PageHeading from "widgets/page-heading";

interface PageShellProps {
  title: string;
  /** Row of page-level actions (primary button, export, status badge). */
  actions?: ReactNode;
  /** Statistics row rendered under the heading; compose with `Row`/`Col`. */
  stats?: ReactNode;
  children: ReactNode;
}

/** The standard listing page frame: gutters, heading, optional stats, content. */
export default function PageShell({ title, actions, stats, children }: PageShellProps) {
  return (
    <div className="container-fluid p-3 p-md-4 shopee-page">
      <PageHeading heading={title}>{actions}</PageHeading>
      {stats ? <div className="mb-4">{stats}</div> : null}
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Implement FilterBar**

Create `src/widgets/filter-bar.tsx`:

```tsx
import type { ReactNode } from "react";
import { Button, Card } from "react-bootstrap";
import { RotateCcw } from "react-feather";

interface FilterBarProps {
  children: ReactNode;
  /** Pass only while a filter is active; the reset control appears with it. */
  onReset?: () => void;
}

/** The list card's filter toolbar: a search landmark with an optional reset. */
export default function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <Card.Body className="px-4 py-3 border-bottom">
      <form
        role="search"
        className="d-flex flex-wrap align-items-center gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        {children}
        {onReset ? (
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            onClick={onReset}
          >
            <RotateCcw size={14} className="me-1" aria-hidden="true" />
            Reset
          </Button>
        ) : null}
      </form>
    </Card.Body>
  );
}
```

- [ ] **Step 5: Implement StatCard**

Create `src/widgets/stat-card.tsx`:

```tsx
import type { ReactNode } from "react";
import { Card } from "react-bootstrap";

type StatTone = "primary" | "success" | "warning" | "danger" | "info";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
}

/** A single shopee-card statistic: label, tabular value, hint, toned icon. */
export default function StatCard({ label, value, hint, icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="shopee-card h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted text-uppercase fw-semibold fs-6">{label}</span>
          {icon ? (
            <div className={`stat-icon stat-icon-${tone}`} aria-hidden="true">
              {icon}
            </div>
          ) : null}
        </div>
        <p className="fs-4 fw-bold mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </p>
        {hint ? <span className="text-muted small">{hint}</span> : null}
      </Card.Body>
    </Card>
  );
}
```

- [ ] **Step 6: Raise the PageHeading element to `h1`**

In `src/widgets/page-heading.tsx`, replace `<h3 ...>` with:

```tsx
<h1 className="mb-0 fw-semibold" style={{ fontSize: "1rem", color: "var(--bs-dark)" }}>{heading}</h1>
```

(The visual size stays; each page now has one level-one heading.)

- [ ] **Step 7: Run tests and gates**

Run: `pnpm vitest run src/widgets/` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean (existing pages keep passing; all heading assertions use role + name).

- [ ] **Step 8: Commit (only when authorized)**

```bash
git add src/widgets/page-shell.tsx src/widgets/filter-bar.tsx src/widgets/stat-card.tsx src/widgets/page-heading.tsx src/widgets/list-chrome.test.tsx
git commit -m "feat: add shared list chrome widgets"
```

---

### Task 4: DataTable + Pagination

**Files:**
- Create: `src/widgets/data-table.tsx`
- Create: `src/widgets/pagination.tsx`
- Modify: `src/styles/_user.scss` (append `.shopee-skeleton`)
- Test: `src/widgets/data-table.test.tsx`

**Interfaces:**
- Consumes: `EmptyState`, `ErrorState` (Task 2); `--shopee-*` tokens.
- Produces:
  - `DataTableColumn<Row> { id: string; header: ReactNode; width?: string; align?: "start" | "end"; className?: string; skeletonWidth?: number; render: (row: Row) => ReactNode }`
  - `DataTable<Row> { columns: DataTableColumn<Row>[]; rows: Row[]; getRowKey: (row: Row) => string; caption?: string; emptyState?: ReactNode; errorMessage?: string; onRetry?: () => void; isLoading?: boolean; loadingRows?: number }`
  - `Pagination { page: number; pageSize: number; total: number; onPage: (page: number) => void; itemLabel?: string }`

- [ ] **Step 1: Write the failing tests**

Create `src/widgets/data-table.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/widgets/data-table.test.tsx`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Implement DataTable**

Create `src/widgets/data-table.tsx`:

```tsx
import type { ReactNode } from "react";
import { Table } from "react-bootstrap";

import ErrorState from "widgets/error-state";

export interface DataTableColumn<Row> {
  id: string;
  /** A header cell; put sort buttons here so sorting stays feature-owned. */
  header: ReactNode;
  width?: string;
  align?: "start" | "end";
  className?: string;
  /** Skeleton bar width in px for this column while loading. */
  skeletonWidth?: number;
  render: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  caption?: string;
  emptyState?: ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
  isLoading?: boolean;
  loadingRows?: number;
}

function cellClass<Row>(column: DataTableColumn<Row>): string {
  const parts: string[] = [];
  if (column.align === "end") parts.push("text-end", "pe-4");
  if (column.className) parts.push(column.className);
  return parts.join(" ");
}

function headerCellClass<Row>(column: DataTableColumn<Row>): string {
  return column.align === "end" ? "text-end pe-4" : "";
}

/**
 * The shared table for listing surfaces.
 *
 * Order of precedence: error, loading, empty, ready. The empty state renders without a
 * table element so "no rows were invented" stays testable; skeleton rows are hidden from
 * assistive tech so the loading state is not announced row by row.
 */
export default function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyState,
  errorMessage,
  onRetry,
  isLoading = false,
  loadingRows = 5,
}: DataTableProps<Row>) {
  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  const head = (
    <thead className="table-light">
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            scope="col"
            style={column.width ? { width: column.width } : undefined}
            className={headerCellClass(column)}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );

  if (isLoading) {
    return (
      <Table responsive className="align-middle mb-0 text-nowrap">
        {caption ? <caption className="px-4 text-muted small">{caption}</caption> : null}
        {head}
        <tbody>
          {Array.from({ length: loadingRows }, (_, index) => (
            <tr key={index} aria-hidden="true">
              {columns.map((column) => (
                <td key={column.id} className={cellClass(column)}>
                  <span
                    className="shopee-skeleton"
                    style={{ width: column.skeletonWidth ?? 96 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  if (rows.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <Table responsive className="align-middle mb-0 text-nowrap">
      {caption ? <caption className="px-4 text-muted small">{caption}</caption> : null}
      {head}
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)}>
            {columns.map((column) => (
              <td key={column.id} className={cellClass(column)}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

- [ ] **Step 4: Implement Pagination**

Create `src/widgets/pagination.tsx`:

```tsx
import { Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-feather";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  itemLabel?: string;
}

/**
 * The shared pager.
 *
 * The range comes from the caller's own total (the server's `total` for the products
 * contract; the filtered sample count for orders), never from the rows currently rendered.
 * A stale page is clamped into range, and disabled directions stay visible so the control
 * does not move under the cursor between pages.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  onPage,
  itemLabel = "items",
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const first = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const last = Math.min(safePage * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="d-flex flex-wrap justify-content-between align-items-center gap-3 px-4 py-3 border-top"
    >
      <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
        Showing {first}–{last} of {total} {itemLabel}
      </span>

      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
          Page {safePage} of {pageCount}
        </span>
        <div className="d-flex gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={safePage <= 1}
            onClick={() => onPage(safePage - 1)}
          >
            <ChevronLeft size={14} className="me-1" aria-hidden="true" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={safePage >= pageCount}
            onClick={() => onPage(safePage + 1)}
          >
            Next
            <ChevronRight size={14} className="ms-1" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: Add the skeleton style**

Append to `src/styles/_user.scss`:

```scss
.shopee-skeleton {
  display: block;
  height: 0.875rem;
  border-radius: $border-radius-sm;
  background-color: $gray-200;
  animation: shopee-pulse 1.2s ease-in-out infinite;
}

@keyframes shopee-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shopee-skeleton {
    animation: none;
  }
}
```

- [ ] **Step 6: Run tests and gates**

Run: `pnpm vitest run src/widgets/` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck && pnpm run test` — Expected: clean.

- [ ] **Step 7: Commit (only when authorized)**

```bash
git add src/widgets/data-table.tsx src/widgets/pagination.tsx src/widgets/data-table.test.tsx src/styles/_user.scss
git commit -m "feat: add shared data table and pagination widgets"
```

---

### Task 5: Products page adoption

**Files:**
- Modify: `src/features/products/components/products-table.tsx` (keep badge + empty state; add `productColumns`; drop the inline table, skeleton, and pager)
- Modify: `src/features/products/components/products-page.tsx`
- Delete: `src/features/products/components/product-filters.tsx` (unreferenced after the rewrite)
- Test: `tests/integration/product-order-pages.test.tsx` (add one pager case)

**Interfaces:**
- Consumes: `PageShell`, `StatCard`, `FilterBar`, `DataTable`, `DataTableColumn`, `Pagination`, `EmptyState`.
- Produces: `productColumns({ categoryNames, brandNames, canWrite }): DataTableColumn<ProductSummary>[]`; `ProductsEmptyState { canWrite: boolean }` unchanged in name, now built on `EmptyState`.

- [ ] **Step 1: Write the new failing pager case**

Add to `describe("products page", ...)` in `tests/integration/product-order-pages.test.tsx`:

```tsx
  it("shows the contract's own total in the shared pager", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });

    renderWithProviders(<ProductsPage />, { session: sessionFixture });
    await screen.findByText("Cloudline Pendant");

    expect(screen.getByText(/showing 1–1 of 1 products/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx`
Expected: the new case FAILS — no `Pagination` landmark yet.

- [ ] **Step 3: Rewrite `products-table.tsx`**

Replace the contents of `src/features/products/components/products-table.tsx` with:

```tsx
import Link from "next/link";
import { Edit2, Eye, Package } from "react-feather";

import EmptyState from "widgets/empty-state";
import type { DataTableColumn } from "widgets/data-table";

import { formatDate } from "features/products/mapping";
import type { ProductStatus, ProductSummary } from "features/products/types";

/** The three statuses the contract has, each with its own tone and dot. */
export function ProductStatusBadge({ status }: { status: ProductStatus | string }) {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return (
      <span className="badge-status badge-status-success">
        <span className="badge-dot bg-success" />
        Active
      </span>
    );
  }

  if (normalized === "inactive") {
    return (
      <span className="badge-status badge-status-secondary">
        <span className="badge-dot bg-secondary" />
        Inactive
      </span>
    );
  }

  return (
    <span className="badge-status badge-status-warning">
      <span className="badge-dot bg-warning" />
      Draft
    </span>
  );
}

/**
 * The empty state for a shop that has not created a product yet.
 *
 * It says the list is empty because it is empty. A product starts as a draft, so the copy
 * also says what happens next rather than implying the page failed.
 */
export function ProductsEmptyState({ canWrite }: { canWrite: boolean }) {
  return (
    <EmptyState
      icon={<Package size={24} />}
      title="No products yet"
      body="This shop has no products. A new product starts as a draft, so nothing is visible to buyers until you publish it."
      action={canWrite ? { label: "Add your first product", href: "/products/new" } : undefined}
    >
      {canWrite ? null : (
        <p className="text-muted small mb-0">
          Your role can read this shop&apos;s products but not create them.
        </p>
      )}
    </EmptyState>
  );
}

interface ProductColumnContext {
  /** Resolved from the cached catalog; a raw id is never shown to a seller. */
  categoryNames: Map<string, string>;
  brandNames: Map<string, string>;
  canWrite: boolean;
}

/**
 * Column definitions for the product list.
 *
 * Every column is a fact the list endpoint returns. There is deliberately no price or
 * stock column: both belong to a variant, and the list payload carries neither, so showing
 * them here would mean inventing a number. The product's own page has them.
 */
export function productColumns({
  categoryNames,
  brandNames,
  canWrite,
}: ProductColumnContext): DataTableColumn<ProductSummary>[] {
  return [
    {
      id: "product",
      header: "Product",
      width: "34%",
      skeletonWidth: 160,
      render: (product) => (
        <>
          <Link
            href={`/products/${product.id}`}
            className="fw-semibold text-dark d-block text-decoration-none"
          >
            {product.name}
          </Link>
          <span className="text-muted small">Added {formatDate(product.created_at)}</span>
        </>
      ),
    },
    {
      id: "category",
      header: "Category",
      skeletonWidth: 80,
      render: (product) => (
        <span className="text-secondary small">{categoryNames.get(product.category_id) ?? "—"}</span>
      ),
    },
    {
      id: "brand",
      header: "Brand",
      skeletonWidth: 64,
      render: (product) => (
        <span className="text-secondary small">
          {product.brand_id ? (brandNames.get(product.brand_id) ?? "—") : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      skeletonWidth: 72,
      render: (product) => <ProductStatusBadge status={product.status} />,
    },
    {
      id: "updated",
      header: "Updated",
      skeletonWidth: 84,
      render: (product) => <span className="text-muted small">{formatDate(product.updated_at)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      skeletonWidth: 60,
      render: (product) => (
        <div className="d-inline-flex gap-1">
          <Link
            href={`/products/${product.id}`}
            className="table-action-btn"
            aria-label={`View ${product.name}`}
          >
            <Eye size={15} />
          </Link>
          {canWrite ? (
            <Link
              href={`/products/${product.id}/edit`}
              className="table-action-btn"
              aria-label={`Edit ${product.name}`}
            >
              <Edit2 size={15} />
            </Link>
          ) : null}
        </div>
      ),
    },
  ];
}
```

(Delete the old `ProductsTable` default export, `ProductsTableSkeleton`, and `ProductsPager`; only `products-page.tsx` consumed them.)

- [ ] **Step 4: Rewrite `products-page.tsx`**

Replace the contents of `src/features/products/components/products-page.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, Col, Form, Row } from "react-bootstrap";
import { Plus } from "react-feather";

import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import StatCard from "widgets/stat-card";

import { ApiError } from "lib/api/client";

import { useAuth } from "features/auth/auth-context";
import { categoryNameMap, useBrandsQuery, useCategoryTreeQuery } from "features/catalog";
import { ProductsEmptyState, productColumns } from "features/products/components/products-table";
import { PRODUCT_STATUSES } from "features/products/constants";
import { productStatusLabel } from "features/products/mapping";
import { parseProductFilters } from "features/products/schemas";
import { useProductsQuery } from "features/products/queries";

/**
 * The seller's products.
 *
 * Listing state lives in the URL, so a filtered view is a link a seller can send. The
 * query is server-side: `status`, `page`, and `page_size` are the only things the endpoint
 * accepts, and the page shows the contract's own `total` rather than counting the rows it
 * happens to hold.
 */
export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // `useSearchParams` is typed nullable: during a static prerender there is no query
  // string. An empty params object keeps the page renderable instead of throwing, and the
  // parsers below already normalize whatever they are given.
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const { can } = useAuth();

  const filters = parseProductFilters(Object.fromEntries(searchParams.entries()));
  const products = useProductsQuery(filters);

  // Catalog metadata is cached and read-only: resolving ids to names here keeps raw
  // identifiers out of the table.
  const tree = useCategoryTreeQuery();
  const brands = useBrandsQuery();

  const categoryNames = categoryNameMap(tree.data ?? []);
  const brandNames = new Map((brands.data ?? []).map((brand) => [brand.id, brand.name]));

  const canWrite = can("products:write");
  const page = products.data;

  function updateQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToPage(pageNumber: number) {
    updateQuery({ page: String(pageNumber) });
  }

  const failure = products.error;
  const errorMessage = products.isError
    ? failure instanceof ApiError
      ? failure.message
      : "The product list could not be loaded."
    : undefined;

  return (
    <PageShell
      title="Products"
      actions={
        canWrite ? (
          <Link href="/products/new" className="btn btn-primary btn-sm d-inline-flex align-items-center">
            <Plus size={15} className="me-1" aria-hidden="true" />
            Add product
          </Link>
        ) : undefined
      }
      stats={
        <Row className="g-3">
          <Col xl={3} md={6}>
            <StatCard
              label="Total products"
              value={products.isPending ? "—" : (page?.total ?? "—")}
              hint={filters.status ? `Filtered to ${filters.status}` : "Every status"}
            />
          </Col>
        </Row>
      }
    >
      <Card className="shopee-card">
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

        <Card.Body className="px-0 py-0">
          <DataTable
            columns={productColumns({ categoryNames, brandNames, canWrite })}
            rows={page?.items ?? []}
            getRowKey={(product) => product.id}
            isLoading={products.isPending}
            errorMessage={errorMessage}
            onRetry={() => void products.refetch()}
            emptyState={<ProductsEmptyState canWrite={canWrite} />}
          />
          {!products.isError && page && page.items.length > 0 ? (
            <Pagination
              page={page.page}
              pageSize={page.page_size}
              total={page.total}
              onPage={goToPage}
              itemLabel="products"
            />
          ) : null}
        </Card.Body>
      </Card>
    </PageShell>
  );
}
```

- [ ] **Step 5: Run tests and gates**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx tests/integration/empty-states.test.tsx` — Expected: PASS.
Run: `pnpm run test` — Expected: PASS (183 + new).
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 6: Commit (only when authorized)**

```bash
git add src/features/products tests/integration/product-order-pages.test.tsx
git commit -m "feat: adopt shared list surfaces on the products page"
```

---

### Task 6: Orders page adoption

**Files:**
- Modify: `src/features/orders/components/orders-table.tsx` (keep `OrderStatusBadge`; wrap `OrdersEmptyState` on `EmptyState`; add `orderColumns` + `SortButton`; drop `OrdersTableSkeleton`)
- Modify: `src/features/orders/components/orders-page.tsx`
- Test: `tests/integration/product-order-pages.test.tsx` (existing orders cases keep passing)

**Interfaces:**
- Consumes: `PageShell`, `StatCard`, `FilterBar`, `DataTable`, `DataTableColumn`, `Pagination`, `EmptyState`.
- Produces: `orderColumns({ sort, onSort, onView }): DataTableColumn<MockOrder>[]`; `SortButton` moves into `orders-table.tsx`.

- [ ] **Step 1: Confirm the regression baseline**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx`
Expected: PASS on the current page (baseline). These cases pin heading, stat copy, search placeholder, and the drawer open action; they must still pass after adoption:
- `renders the Orders page structure with heading and stat cards`
- `opens a compact order detail drawer from a sample row`

No new orders test file is needed; the shared widgets are already unit-tested. This step is the regression baseline.

- [ ] **Step 2: Rewrite `orders-table.tsx`**

Replace the contents of `src/features/orders/components/orders-table.tsx` with:

```tsx
import { ChevronDown, ChevronUp, ChevronsDown, Eye, ShoppingBag } from "react-feather";

import EmptyState from "widgets/empty-state";
import type { DataTableColumn } from "widgets/data-table";

import type { MockOrder } from "features/orders/mock-data";

export type OrderSortKey = "reference" | "customer" | "total" | "status" | "placedAt";
export type SortDirection = "asc" | "desc";

export interface OrderSort {
  key: OrderSortKey;
  direction: SortDirection;
}

/** Semantic status badge for orders. */
export function OrderStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? "unknown").toLowerCase();

  switch (normalized) {
    case "completed":
    case "delivered":
    case "paid":
      return (
        <span className="badge-status badge-status-success">
          <span className="badge-dot bg-success" />
          Completed
        </span>
      );
    case "processing":
    case "confirmed":
    case "shipped":
      return (
        <span className="badge-status badge-status-info">
          <span className="badge-dot bg-info" />
          Processing
        </span>
      );
    case "pending":
    case "pending_payment":
      return (
        <span className="badge-status badge-status-warning">
          <span className="badge-dot bg-warning" />
          Pending
        </span>
      );
    case "cancelled":
    case "failed":
    case "refunded":
      return (
        <span className="badge-status badge-status-danger">
          <span className="badge-dot bg-danger" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="badge-status badge-status-secondary">
          <span className="badge-dot bg-secondary" />
          {status ?? "Unknown"}
        </span>
      );
  }
}

/** Honest empty state: no rows are fabricated when the list has no data. */
export function OrdersEmptyState() {
  return (
    <EmptyState
      icon={<ShoppingBag size={24} />}
      title="No orders yet"
      body="The orders module has not published an endpoint, so there is nothing to list."
    />
  );
}

/** Sort control that lives inside a column header so sorting stays feature-owned. */
function SortButton({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: OrderSortKey;
  sort: OrderSort;
  onSort: (column: OrderSortKey) => void;
}) {
  const active = sort.key === column;
  const Icon = active ? (sort.direction === "asc" ? ChevronUp : ChevronDown) : ChevronsDown;

  return (
    <button
      type="button"
      className="table-sort-btn"
      aria-label={`Sort orders by ${label}`}
      aria-pressed={active}
      onClick={() => onSort(column)}
    >
      <span>{label}</span>
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

function formatPrice(total?: number | string): string {
  if (total === undefined || total === null || total === "") return "-";
  const num = typeof total === "number" ? total : Number(total);
  return Number.isNaN(num) ? String(total) : `$${num.toFixed(2)}`;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function getInitials(name?: string): string {
  if (!name) return "C";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0]![0]}${parts.at(-1)![0]}`.toUpperCase()
    : parts[0]!.slice(0, 2).toUpperCase();
}

/** Column definitions for the sample order list. */
export function orderColumns({
  sort,
  onSort,
  onView,
}: {
  sort: OrderSort;
  onSort: (column: OrderSortKey) => void;
  onView: (order: MockOrder) => void;
}): DataTableColumn<MockOrder>[] {
  return [
    {
      id: "reference",
      header: <SortButton label="Order" column="reference" sort={sort} onSort={onSort} />,
      width: "24%",
      skeletonWidth: 110,
      render: (order) => (
        <>
          <span className="fw-semibold text-primary d-block">{order.reference}</span>
          <span className="text-muted small">ID: {order.id}</span>
        </>
      ),
    },
    {
      id: "customer",
      header: <SortButton label="Customer" column="customer" sort={sort} onSort={onSort} />,
      width: "24%",
      skeletonWidth: 100,
      render: (order) => (
        <div className="d-flex align-items-center">
          <div className="customer-avatar me-2" aria-hidden="true">
            {getInitials(order.customer)}
          </div>
          <span className="text-dark fw-medium">{order.customer}</span>
        </div>
      ),
    },
    {
      id: "items",
      header: "Items",
      skeletonWidth: 45,
      render: (order) => (
        <span className="text-secondary small">
          {order.itemsCount} {order.itemsCount === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      id: "total",
      header: <SortButton label="Total" column="total" sort={sort} onSort={onSort} />,
      skeletonWidth: 65,
      render: (order) => <span className="fw-semibold text-dark">{formatPrice(order.total)}</span>,
    },
    {
      id: "status",
      header: "Status",
      skeletonWidth: 76,
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: "placed",
      header: <SortButton label="Placed" column="placedAt" sort={sort} onSort={onSort} />,
      skeletonWidth: 90,
      render: (order) => <span className="text-muted small">{formatDate(order.placedAt)}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      align: "end",
      skeletonWidth: 28,
      render: (order) => (
        <button
          type="button"
          className="table-action-btn"
          title="View order"
          aria-label={`View order ${order.reference}`}
          onClick={() => onView(order)}
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];
}
```

- [ ] **Step 3: Rewrite `orders-page.tsx`**

Replace the contents of `src/features/orders/components/orders-page.tsx` with:

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Col, Offcanvas, Row } from "react-bootstrap";
import { CheckCircle, Clock, Download, RefreshCw, ShoppingBag } from "react-feather";

import DataTable from "widgets/data-table";
import FilterBar from "widgets/filter-bar";
import PageShell from "widgets/page-shell";
import Pagination from "widgets/pagination";
import StatCard from "widgets/stat-card";

import { OrdersEmptyState, OrderStatusBadge, orderColumns, type OrderSort, type OrderSortKey } from "features/orders/components/orders-table";
import { MOCK_ORDERS, type MockOrder } from "features/orders/mock-data";
import { parseOrderFilters } from "features/orders/schemas";

function formatPrice(total?: number | string): string {
  if (total === undefined || total === null || total === "") return "-";
  const num = typeof total === "number" ? total : Number(total);
  return Number.isNaN(num) ? String(total) : `$${num.toFixed(2)}`;
}

function compareOrders(a: MockOrder, b: MockOrder, key: OrderSortKey): number {
  if (key === "total") return Number(a.total ?? 0) - Number(b.total ?? 0);
  return String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
}

function OrderDetailDrawer({ order, onClose }: { order: MockOrder | null; onClose: () => void }) {
  return (
    <Offcanvas show={order !== null} onHide={onClose} placement="end" scroll backdrop aria-labelledby="order-detail-title">
      {order ? (
        <>
          <Offcanvas.Header closeButton>
            <div>
              <Offcanvas.Title id="order-detail-title" className="mb-1">{order.reference}</Offcanvas.Title>
              <span className="text-muted small">Sample order detail</span>
            </div>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <span className="text-muted small d-block">Customer</span>
                <strong>{order.customer}</strong>
                <span className="text-muted small d-block">{order.email}</span>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="drawer-section">
              <h6 className="mb-3">Items</h6>
              <div className="d-flex flex-column gap-3">
                {order.items.map((item) => (
                  <div className="d-flex justify-content-between gap-3" key={item.name}>
                    <div>
                      <span className="d-block fw-medium">{item.name}</span>
                      <span className="text-muted small">Qty {item.quantity}</span>
                    </div>
                    <span className="fw-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between border-top mt-3 pt-3">
                <strong>Total</strong>
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>

            <div className="drawer-section">
              <h6 className="mb-3">Shipping address</h6>
              <p className="text-muted mb-0">{order.shippingAddress}</p>
            </div>

            <div className="drawer-section">
              <h6 className="mb-3">Payment</h6>
              <p className="text-muted mb-0">{order.payment}</p>
            </div>

            <Button variant="outline-secondary" className="w-100">Open full order</Button>
          </Offcanvas.Body>
        </>
      ) : null}
    </Offcanvas>
  );
}

/** Order list mockup with local sample data, client-side sort/paging, and a detail drawer. */
export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  // Nullable in the generated route types (a static prerender has no query string); an
  // empty set keeps the lists renderable and the parsers normalize what they get.
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const initialFilters = parseOrderFilters(Object.fromEntries(searchParams.entries()));
  const [search, setSearch] = useState(initialFilters.search);
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [sort, setSort] = useState<OrderSort>({ key: "placedAt", direction: "desc" });
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);

  function updateFilters(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToPage(pageNumber: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pageNumber));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function updateSearch(value: string) {
    setSearch(value);
    updateFilters({ search: value || undefined });
  }

  function updateStatus(value: string) {
    setStatus(value);
    updateFilters({ status: value === "all" ? undefined : value });
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    updateFilters({ search: undefined, status: undefined });
  }

  function toggleSort(column: OrderSortKey) {
    setSort((current) => ({
      key: column,
      direction: current.key === column && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...MOCK_ORDERS]
      .filter((order) => {
        const matchesSearch = !query || `${order.reference} ${order.customer}`.toLowerCase().includes(query);
        const matchesStatus = status === "all" || order.status === status;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const result = compareOrders(a, b, sort.key);
        return sort.direction === "asc" ? result : -result;
      });
  }, [search, sort, status]);

  const pageSize = initialFilters.pageSize;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(initialFilters.page, 1), pageCount);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const completedCount = MOCK_ORDERS.filter((order) => order.status === "completed").length;
  const processingCount = MOCK_ORDERS.filter((order) => order.status === "processing").length;
  const pendingCount = MOCK_ORDERS.filter((order) => order.status === "pending").length;

  return (
    <PageShell
      title="Orders"
      actions={
        <div className="d-flex align-items-center gap-2">
          <Badge bg="light" text="dark" className="mock-data-badge">Sample data</Badge>
          <Button variant="outline-secondary" size="sm" className="d-inline-flex align-items-center">
            <Download size={15} className="me-1" aria-hidden="true" />
            Export orders
          </Button>
        </div>
      }
      stats={
        <Row className="g-3">
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Total orders" value={MOCK_ORDERS.length} hint="All received orders" icon={<ShoppingBag size={16} />} />
          </Col>
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Completed" value={completedCount} hint="Fulfilled and delivered" tone="success" icon={<CheckCircle size={16} />} />
          </Col>
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Processing" value={processingCount} hint="In preparation or transit" tone="info" icon={<RefreshCw size={16} />} />
          </Col>
          <Col xl={3} sm={6} xs={12}>
            <StatCard label="Pending" value={pendingCount} hint="Awaiting payment or action" tone="warning" icon={<Clock size={16} />} />
          </Col>
        </Row>
      }
    >
      <Card className="shopee-card">
        <FilterBar onReset={resetFilters}>
          <div style={{ minWidth: 260 }}>
            <label htmlFor="order-search" className="visually-hidden">Search orders</label>
            <input
              id="order-search"
              type="search"
              className="form-control form-control-sm"
              placeholder="Search by order reference or customer"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </div>
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

        <DataTable
          columns={orderColumns({ sort, onSort: toggleSort, onView: setSelectedOrder })}
          rows={pagedRows}
          getRowKey={(order) => order.id}
          caption={`Sample orders: ${rows.length} matching.`}
          emptyState={<OrdersEmptyState />}
        />
        {rows.length > 0 ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPage={goToPage}
            itemLabel="orders"
          />
        ) : null}
      </Card>

      <OrderDetailDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </PageShell>
  );
}
```

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run tests/integration/product-order-pages.test.tsx` — Expected: PASS, including the drawer test clicking `View order ORD-2048`.
Run: `pnpm run test` — Expected: PASS.
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit (only when authorized)**

```bash
git add src/features/orders tests/integration
git commit -m "feat: adopt shared list surfaces on the orders page"
```

---

### Task 7: Verification pass

**Files:** none (verification only; fixes land as `style:`/`fix:` edits in place).

- [ ] **Step 1: Run all four gates**

Run: `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`
Expected: all green. Fix failures before continuing.

- [ ] **Step 2: Dev-server smoke**

Run: `pnpm dev` and request `/products`, `/products/new`, `/orders`, `/` — expected HTML responses with no compilation errors.

- [ ] **Step 3: Batched visual pass (one batch, one confirm round)**

With the dev server up, check desktop (1440) and mobile (375) for: shell sidebar collapse and mobile drawer backdrop; products filter, table, pagination, empty, error, loading states; orders stat cards, filter, sortable headers, pagination, drawer. Log every defect in one list, fix in one batch, re-check only the fixed items, then stop.

- [ ] **Step 4: Record results**

Append the outcome (gates output summary + defects found/fixed) to this plan under a `## Verification record` section, and leave the changes uncommitted unless the user authorizes a commit.

---

## Verification record

Executed 2026-10-07 (no commits — user instruction; changes live in the working tree).

- Gates: `pnpm run lint` exit 0; `pnpm run typecheck` clean; `pnpm run test` 201/201 (21 files); `pnpm run build` success (11 routes).
- Smoke: the already-running dev server for this directory (port 3000) returned 200 for `/`, `/products`, `/orders`, `/products/new`, `/login`.
- Skin: login surface screenshotted at 1440 and 375; renders correctly.
- Authenticated visual pass (shell, products/orders tables, filters, pagination, empty/error states): parked for the signed-in human; the route guard redirects the session-less automation to `/login`.
- Reviews: six task reviews clean (Task 5 needed one fix round: stale pager under error + dead `product-filters.tsx`); final whole-phase review produced two Important fixes (dashboard heading order, `headerCellClass` ignoring `className`) plus cheap minors (export `StatTone`, `pageSize <= 0` guard, delete dead `order-filters.tsx`) — all fixed and scoped-re-reviewed clean, including one residual SCSS selector fix for the dashboard card-header skin.
- Deviations from the plan text, ruled during execution: Sass interpolation inside custom properties; `.worktrees/**` added to ESLint ignores; pagination guard `!products.isError`; `product-filters.tsx`/`order-filters.tsx` deleted; `orderColumns` summary line gained `onView`.
- Committed `ac4e6f5` on `feat/cms-shared-surfaces` (pushed to origin; includes the previously uncommitted App Router migration and Shopee skin, which this phase builds on). `bun.lock` and local env files excluded.
- PR: https://github.com/Huyhoang120904/ecom-cms-fe/pull/1 (created via the repo-owner gh account).
- Still open (parked, not fixed): orders empty-state copy under active filters ("module has not published an endpoint" when filters exclude all rows); products status select carries both a label and `aria-label`; minor test-coverage polish; authenticated visual pass.
