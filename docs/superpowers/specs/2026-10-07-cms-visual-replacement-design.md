# CMS visual replacement — design

Date: 2026-10-07. Scope: `ecom-cms-fe` (seller CMS). Goal: full
visual + UX + accessibility pass that **replaces** the incumbent
Bootstrap look with a new visual world. Approach: phased replacement
(approved 2026-10-07) — Phase 1 builds the system + shell + shared
layer and the `DESIGN.md` contract; Phase 2+ rolls it out per feature.

Skills for implementation: `ui-ux-pro-max` (system, UX rules, a11y)
first, then `impeccable` (visual world, craft floor, verification
passes). Both load per phase, not once upfront.

## Constraints (from AGENTS.md, non-negotiable)

- pnpm only; gates per phase: `lint`, `typecheck`, `test`, `build`.
- Feature modules own their components, queries, schemas, pages.
  `lib/` stays behavior-free; components never call `fetch`.
- No invented data — empty states say empty.
- Auth/session untouched: token in memory, single-flight refresh in
  `authFetch`, `can(...)` + nav filter presentation-only, backend is
  the authority. Login keeps asking for `audience: "cms"`.
- Every `2xx` body unwrapped via `unwrapEnvelope`; errors keep
  `{ error, message }`; unparseable bodies throw `invalid_response`.

## S1 — Architecture (Phase 1)

1. **Tokens + contract.** Replace `src/styles/` content with a
   token-first theme (`tokens → base → components → utilities`) and
   add `DESIGN.md` (the new world's palettes, type scale, spacing,
   radii, elevation, motion). Old Bootstrap partials go; no parallel
   theme systems.
2. **Shell.** Rework `src/app/shell/` (`app-shell`, `shell-navigation`,
   `account-menu`, `sidebar-toggle`, `navigation.ts` filter unchanged
   in behavior) on the new tokens. Signed-out / unusable-session
   notice states keep their current semantics, new look.
3. **Shared widgets.** Grow `src/widgets/` from `page-heading` into
   the shared set: button, text input/select/textarea, table, card,
   dialog, badge, pagination, plus state components (skeleton,
   empty-state, error-state with retry). Feature modules consume them;
   feature-specific components stay in their modules.
4. **Untouched:** `features/auth` session lifecycle, `lib/api`,
   `lib/auth`, `lib/query`, envelope handling, query keys.

## S2 — Components + states

- Every data surface renders three designed states: loading
  (skeleton), empty (message + the next action that creates data),
  error (message + retry that re-fires the query).
- Forms: visible labels, inline errors adjacent to fields, helper
  text where the bound needs explaining; bounds still read from the
  mirrored constants so browser and validator agree.
- Destructive actions keep confirm dialogs, preserving the typed-name
  deletion pattern where it exists (shop retirement).
- Zod parsing of form/decision-driving responses stays — a moved
  backend field must still fail loudly as `invalid_response`.

## S3 — Accessibility floor (verified per phase, never deferred)

Contrast ≥ 4.5:1 for text; visible focus rings everywhere;
keyboard reachability for nav, menus, dialogs, tables, pagination;
accessible names on all icon-only controls; no placeholder-only
labels; `prefers-reduced-motion` disables non-essential motion.

## S4 — Rollout + verification

Rollout after Phase 1, each its own implementation plan reusing
shared + `DESIGN.md`: products → orders → dashboard → shop → auth
(auth last: smallest visual surface — login/register pages only;
the session lifecycle stays untouched).

Verification per phase (bounded, not a loop):

1. `pnpm run lint`, `typecheck`, `test`, `build` — all green.
2. One batched visual pass (desktop + mobile together on the web),
   every defect fixed in one batch, at most one confirm round, then
   stop. No open-ended self-QA.

## Out of scope

Backend changes; new endpoints or metrics; placeholder dashboard
tiles (stay dashed until `ecom-be` ships the endpoint); fulfillment
or analytics features; touching the refresh/token lifecycle.
