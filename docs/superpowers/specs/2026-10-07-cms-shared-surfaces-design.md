# CMS shared surfaces — design (Phase 2)

Date: 2026-10-07. Scope: `ecom-cms-fe` (seller CMS, App Router worktree).

Supersedes, for the current cms-fe tree, the Phase 1 "CMS token world"
direction in `2026-10-07-cms-visual-replacement-design.md`. The Phase 1
branch (`cms-visual-phase1` worktree) built a slate/blue token world on
the older Pages Router base. The main worktree has since adopted a
**Shopee Seller Centre** skin (orange `#EE4D2D` brand, `#F6F6F6` page
ground, white 4px-radius cards) and remains the active direction. This
phase builds its shared listing surfaces on that skin. The Phase 1
branch is left untouched and unmerged; only its patterns (labelled
landmarks, honest empty states) carry over.

## Constraints (from AGENTS.md, non-negotiable)

- pnpm only; gates per phase: `lint`, `typecheck`, `test`, `build`.
- Feature modules own their components, queries, schemas, pages.
  `lib/` stays behavior-free; components never call `fetch`.
- No invented data — empty states say empty.
- Auth/session untouched: token in memory, single-flight refresh in
  `authFetch`, `can(...)` + nav filter presentation-only, backend is
  the authority.
- Every `2xx` body unwrapped via `unwrapEnvelope`; errors keep
  `{ error, message }`.
- Keep `react-bootstrap` component APIs; no feature-code churn beyond
  the two listing pages this phase adopts.

## S1 — Base

- Visual base: the Shopee skin already in the working tree
  (`_user-variables.scss` + shopee sections of `_user.scss`). No CMS
  token port; no new theme pipeline.
- Add a small semantic layer (`--shopee-*` custom properties in
  `_user.scss`) so shared widgets read named tokens instead of raw hex.
  SCSS compiles the values from `_user-variables.scss`, one source.
- Shell and other feature pages keep their current skin; only a11y
  gaps found here are fixed (mobile backdrop becomes a real button).

## S2 — Shared widgets (`src/widgets/`)

Presentational only; feature modules keep data behavior.

1. `page-shell.tsx` — `PageShell { title, actions?, stats?, children }`.
   Page container (`container-fluid p-3 p-md-4 shopee-page`), heading
   (via `PageHeading`, now an `<h1>`), optional stats slot, content.
2. `filter-bar.tsx` — `FilterBar { children, onReset? }`. `role="search"`
   toolbar inside the list card; reset button rendered only when
   `onReset` is passed.
3. `data-table.tsx` — generic `DataTable<Row> { columns, rows,
   getRowKey, caption?, emptyState?, errorMessage?, onRetry?,
   isLoading?, loadingRows? }`. Column = `{ id, header: ReactNode,
   width?, align?, className?, skeletonWidth?, render(row) }`; sort
   buttons live inside `header`. Renders: error (`role="alert"` +
   retry), loading (real headers + aria-hidden skeleton rows), empty
   (slot, no table element), or the ready table with `scope="col"`
   headers, caption, and `Table responsive` overflow.
4. `pagination.tsx` — `Pagination { page, pageSize, total, onPage,
   itemLabel? }`. `nav aria-label="Pagination"`, range text (server's
   own total, tabular numerals), `Page N of M`, Previous/Next disabled
   rather than hidden; clamps a stale page into range.
5. `stat-card.tsx` — `StatCard { label, value, hint?, icon?, tone? }`
   built on `shopee-card` + `stat-icon` tones.
6. `empty-state.tsx` — `EmptyState { icon?, title, body, action?,
   children? }`; `role="status"`, one next action when a role may take
   it, children for a role-specific fallback note.
7. `error-state.tsx` — `ErrorState { message, onRetry? }`; `role="alert"`
   + labelled retry.

`PageHeading` keeps its `heading` + `children` API for all 7 existing
consumers; only its element becomes `<h1>` for heading order.

## S3 — Adoption

- **Products** (real API): `PageShell` + `StatCard` + `FilterBar` +
  `DataTable` + `Pagination`. URL-driven filters, server `total`, Zod
  parsing, `canWrite`, and `ProductStatusBadge` semantics unchanged.
- **Orders** (sample data, clearly labelled): same surfaces; sortable
  headers via column `header` nodes, client-side pagination over the
  filtered sample rows, detail drawer kept.
- Feature empty states keep their copy and wrap the shared
  `EmptyState`; feature table files keep owning badges + empty state.
- Dashboard, shop, profile, auth, and all forms are out of scope for
  this phase (later phases per the umbrella spec).

## S4 — Accessibility floor

Contrast from the existing skin (unchanged); visible focus rings;
tab reachability for filters, table actions, pagination; accessible
names on icon-only controls; skeleton rows `aria-hidden`; `prefers-
reduced-motion` disables the skeleton pulse; tables scroll
horizontally on small screens instead of breaking the layout.

## S5 — Verification

1. `pnpm run lint`, `typecheck`, `test`, `build` — all green.
2. Dev-server smoke of `/products` and `/orders`.
3. One batched visual pass (desktop + mobile), every defect fixed in
   one batch, at most one confirm round, then stop.

## Out of scope

Backend changes; new endpoints; replacing sample order data; dashboard,
shop, profile, and auth restyling; the Phase 1 CMS-token world.
