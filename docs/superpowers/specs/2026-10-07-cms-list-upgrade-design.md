# CMS list upgrade — design (Phase 3)

Date: 2026-10-07. Scope: `ecom-cms-fe` listing surfaces (products, orders)
on the Shopee skin. Builds on the Phase 2 shared widgets (`PageShell`,
`FilterBar`, `StatCard`, `DataTable`, `Pagination`, `EmptyState`,
`ErrorState`); the CMS-token Phase 1 direction stays superseded.

Goal: better table/filter components and feel — segmented status tabs,
active-filter chips, row selection with honest bulk actions, a sorting
API, sticky headers, mobile card layout, and richer pagination — without
inventing data the contracts cannot back.

## Constraints (from AGENTS.md, non-negotiable)

- pnpm only; gates per phase: `lint`, `typecheck`, `test`, `build`.
- Feature modules own components, queries, schemas, pages. `lib/` stays
  behavior-free; components never call `fetch`.
- No invented data. Auth/session untouched; backend authoritative.
- Every `2xx` unwrapped via `unwrapEnvelope`; errors keep
  `{ error, message }`. Destructive actions keep confirm dialogs.
- `react-bootstrap` APIs stay; widgets are presentational.

## Contract facts (verified, binding)

- Products list accepts only `status`, `page`, `page_size` (default 20,
  max 100, URL-synced). No sort parameter exists.
- Products list query uses `placeholderData: keepPreviousData` — page
  transitions keep the old page on screen.
- Products mutations are per-id hook factories with optimistic rollback;
  N hook instances in a loop would violate the rules of hooks.
- Product deletion is non-restorable with a typed-name confirm — the
  pattern does not scale to bulk.
- Orders data is labelled sample data, fully client-side.

## S1 — Core widget API

All extensions are optional fields; existing consumers keep working.

`DataTableColumn<Row>` gains:

- `sortable?: boolean` — header renders a sort button; the `th` carries
  `aria-sort`. Sort state stays controlled in the feature; `DataTable`
  never sorts rows itself.
- `mobile?: { label: string; hide?: boolean }` — card-mode mapping under
  768px. A column without `mobile` is skipped on cards, except the
  actions column, which renders full-width without a label row.

`DataTable<Row>` gains:

- `sort?: { key: string; direction: "asc" | "desc" }` and
  `onSortChange?: (key: string) => void`.
- `selectedKeys?: string[]` and
  `onSelectionChange?: (keys: string[]) => void` — renders a leading
  checkbox column with per-row `aria-label`s and an indeterminate
  header checkbox that toggles the visible page.
- `layout?: "auto" | "table" | "cards"` — `auto` follows a 768px media
  query; explicit values exist so tests can force either rendering.

Selection is page-scoped by construction: features reset it whenever the
rendered rows change identity (filter, page, page size, sort).

New `SegmentedControl<T extends string> { label, options: { value,
label }[], value, onChange, name }` — real radio inputs styled as
segments, arrow-key roving, 44px targets, no counts.

New `FilterChips { chips: { id, label, value }[], onRemove,
onClearAll }` — one removable button per active filter plus a clear-all;
wrapping layout; a chip exists only for a filter not already visible
elsewhere (no chip duplicates a tab).

`Pagination` gains numbered page buttons with ellipsis,
`aria-current="page"` on the current page, and an optional per-page
`select` (honest options only: subsets of what the caller supports).

New `BulkBar { count, itemLabel?, actions: { id, label, icon?, variant?,
confirm? }[], onAction, onClear, isPending? }` — selection count,
action buttons, an optional confirm slot for destructive actions,
pending state on the bar.

Rulings: products gets no sorting (a client-side sort of one server page
would lie); bulk is Publish + Unpublish only and delete stays
single-item typed-name (non-restorable deletes must not ride a
count-confirm); selection resets on any list-identity change.

## S2 — Products adoption

- `FilterBar`: segmented tabs All / Draft / Active / Inactive replace
  the status select. URL-synced with page reset to 1; Reset kept while a
  status is set. No chips (the status is visible in the tabs).
- `DataTable`: `selectable`; mobile cards show product / category /
  status / updated, hide brand, full-width actions.
- `BulkBar` above the table while the selection is non-empty: Publish
  and Unpublish (reversible, so no confirm); disabled while the list is
  loading or errored.
- Execution: a new feature-owned bulk runner in `products/mutations.ts`
  calling the `api.ts` `publishProduct`/`unpublishProduct` functions with
  `Promise.allSettled`, then invalidating the list queries and returning
  per-id results. Full success clears the selection; partial failure
  keeps the failed ids selected and renders a summary banner naming the
  failed products with a retry-failed action that re-fires failures only.
- Pagination: numbers plus a 10/20/50 per-page select writing
  `page_size` to the URL and resetting to page 1.

## S3 — Orders adoption

- `FilterBar`: segmented tabs All / Completed / Processing / Pending /
  Cancelled replace the status select; the search input stays and gains
  a removable chip; Reset preserved.
- `DataTable`: sortable columns Order / Customer / Total / Placed with
  `aria-sort`, controlled sort state defaulting to Placed-desc, kept
  local (not in the URL). No selection: no honest bulk operation exists
  on sample data, and selection without actions is decoration.
- Mobile: a compact sort `select` above the card list reusing the same
  sort state. Pagination numbers plus a 10/20/50 per-page select over the
  filtered sample.
- Drawer, badge, caption honesty, and empty copy unchanged.

## S4 — Feel layer

- Sticky `thead` at the 56px topbar offset, desktop only, solid header
  background, z-index below dropdowns.
- Row hover wash in `--shopee-primary-soft`, `focus-within` ring,
  selected rows tinted with their checkbox.
- Mobile cards below 768px: label/value pairs, checkbox plus actions in
  the card header row, 12px list gaps, card-shaped skeletons while
  loading.
- Motion 150ms hover/press, 200ms expand (bulk bar), transform and
  opacity only; `prefers-reduced-motion` disables all of it.
- Sort is conveyed by `aria-sort` on the `th` only — no duplicated
  `aria-pressed` on the header buttons.

## S5 — States, tests, rollout

- Loading keeps `keepPreviousData` plus the skeleton (table or
  card-shaped by layout). The error branch is unchanged.
- Tests: unit tests for every new widget prop (sort aria + toggle,
  selection + indeterminate + clear, forced card layout, pager
  numbers/ellipsis/per-page, tabs keyboard, chips remove/clear-all,
  bulk pending); integration for products bulk success + partial +
  retry, tabs-to-URL, per-page-to-URL, and orders sort/tabs/chips.
- Verification: `lint`, `typecheck`, `test`, `build`, then one batched
  desktop + mobile visual pass (sticky scroll, 375px cards,
  reduced-motion), defects fixed in one batch.
- One rollout phase: products, then orders.

## Out of scope

Density toggle, column visibility, saved views, bulk delete, products
sorting, the real orders endpoint, and dashboard/shop/auth restyling.
