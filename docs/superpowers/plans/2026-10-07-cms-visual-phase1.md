# CMS visual Phase 1 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cms-fe visual world (tokens, shell, shared widgets) while feature modules keep working untouched.

**Architecture:** Keep `react-bootstrap` component APIs (zero feature-code churn); replace what every pixel comes from — the SCSS theme becomes token-first with own component skins. New shared widgets go in `src/widgets/`. `DESIGN.md` is written first and tokens must match it exactly.

**Tech Stack:** Next.js 16 App Router, TypeScript, SCSS (`sass`), react-bootstrap primitives, vitest + Testing Library (jsdom), `pnpm` only.

**Spec:** `docs/superpowers/specs/2026-10-07-cms-visual-replacement-design.md`

## Global Constraints

- pnpm only; never hand-edit `pnpm-lock.yaml`.
- Gates per task where code changes: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`.
- Feature modules own their components — Phase 1 touches only `src/styles/`, `src/app/shell/`, `src/widgets/`, `DESIGN.md`. No changes under `src/features/`, `src/lib/`, `src/app/(cms)/`, `src/app/(auth)/`.
- No invented data; auth/session/query/envelope code untouched.
- Executor loads `ui-ux-pro-max` at Phase 1 start (token/system/a11y rules) and `impeccable` before any visual edit (run its `scripts/impeccable context` launcher once per session, read `reference/craft-floor.md` before edits).
- Every text/background pair in tokens and DESIGN.md lists its measured contrast ratio (AA: 4.5:1 text).
- Motion ceiling 150–200ms; `prefers-reduced-motion: reduce` disables non-essential motion.

---

### Task 1: DESIGN.md visual contract

**Files:**
- Create: `DESIGN.md` (repo root of `ecom-cms-fe`)

**Interfaces:**
- Consumes: nothing (first task; decisions come from the two design skills at execution).
- Produces: `DESIGN.md` sections — palette table (token name, value, on-colors, ratio), type scale, spacing scale, radii, elevation, motion, state patterns — which Task 2 implements verbatim.

- [ ] **Step 1: Load the design skills and record decisions**

Load `ui-ux-pro-max`, query its data for one palette family, one font pairing, and the `ux` domain rules; load `impeccable` and follow its new-work playbook to pick the visual world. Write `DESIGN.md` with these sections (no section may be empty):

```markdown
# CMS design
## Palette
| Token | Value | Used on | On-color | Ratio |
| ... | ... | ... | ... | ... |
## Typography
## Spacing
## Radii
## Elevation
## Motion
## States (loading / empty / error)
## Shell
```

- [ ] **Step 2: Verify the contract is complete**

Run: `grep -c "TBD\|TODO" DESIGN.md`
Expected: `0` (exit 1 from grep counts as pass — no placeholders).

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md
git commit -m "docs: add CMS visual contract"
```

### Task 2: Token-first theme, DashUI out

**Files:**
- Create: `src/styles/_tokens.scss`
- Modify: `src/styles/_user-variables.scss`, `src/styles/theme.scss`, `src/styles/_user.scss`
- Delete: `src/styles/theme/` (all DashUI partials)
- Test: `src/styles/tokens.test.ts`

**Interfaces:**
- Consumes: `DESIGN.md` palette/type/spacing/radii/elevation/motion tables.
- Produces: CSS custom properties + SCSS variables every later task uses (e.g. `--cms-primary`, `--cms-surface`, `--cms-text`, `--cms-radius-md`); `theme.scss` importing only functions, tokens, bootstrap grid + utilities, reboot, `cms/` skins, user.

- [ ] **Step 1: Write the failing token test**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(resolve(__dirname, "_tokens.scss"), "utf8");

describe("design tokens", () => {
  for (const token of [
    "--cms-primary",
    "--cms-surface",
    "--cms-text",
    "--cms-muted",
    "--cms-border",
    "--cms-radius-md",
    "--cms-shadow-sm",
  ]) {
    it(`defines ${token}`, () => {
      expect(tokens).toContain(token);
    });
  }

  it("documents a contrast ratio for every text/background pair", () => {
    const ratios = tokens.match(/\d+\.\d+:1/g) ?? [];
    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) {
      expect(parseFloat(ratio)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/styles/tokens.test.ts`
Expected: FAIL — `_tokens.scss` does not exist.

- [ ] **Step 3: Write `_tokens.scss` from DESIGN.md**

Every palette row becomes a `--cms-*` custom property plus an SCSS `$` alias; every ratio from DESIGN.md rides along as an inline comment. Keep the font stack decision from DESIGN.md (Inter import stays only if DESIGN.md keeps Inter).

- [ ] **Step 4: Rewire `theme.scss`, retire DashUI**

Rewrite `theme.scss` imports to: fonts, `user-variables`, `tokens`, bootstrap `functions`/`variables`/`maps`/`mixins` (with CMS overrides), bootstrap grid + utilities + reboot, new `cms/` skins (Task 5 adds the files; import lines land here), `user`. Delete `src/styles/theme/`. Trim `_user.scss` sidebar-skin rules superseded by tokens (keep what still applies until Task 3).

- [ ] **Step 5: Run test and build**

Run: `pnpm vitest run src/styles/tokens.test.ts` — Expected: PASS.
Run: `rg -l "theme/" src/styles/theme.scss; rg -li "dashui\|codescandy" src/ || true` — Expected: no matches.
Run: `pnpm run build` — Expected: success.

- [ ] **Step 6: Commit**

```bash
git add src/styles DESIGN.md
git commit -m "style: replace DashUI theme with CMS token system"
```

### Task 3: Shell on the new tokens

**Files:**
- Modify: `src/app/shell/app-shell.tsx`, `src/styles/_user.scss` (shell sections)
- Test: `src/app/shell/shell-a11y.test.tsx`

**Interfaces:**
- Consumes: `--cms-*` tokens from Task 2; `navigation.ts` behavior unchanged.
- Produces: shell visuals (sidebar, topbar, backdrop, unusable-session notice) on tokens; backdrop as a real button.

- [ ] **Step 1: Write the failing shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppShell from "app/shell/app-shell";

vi.mock("features/auth/auth-context", () => ({
  useAuth: () => ({ session: null, can: () => false }),
}));
vi.mock("features/auth/mutations", () => ({
  useLogoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSwitchShopMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("app shell", () => {
  it("renders sidebar landmark and mobile toggle with accessible names", () => {
    render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
  });
});
```

(Note: the existing toggle is `d-md-none`-hidden textless button with aria-label — the test pins the label; the backdrop assertion lands in Step 3.)

- [ ] **Step 2: Run test to verify current gaps**

Run: `pnpm vitest run src/app/shell/shell-a11y.test.tsx`
Expected: FAIL — `app-shell.tsx` has no `aria-label="Sidebar"` on the sidebar `nav`, and the mobile backdrop is a `div` with `onClick` (no button role).

- [ ] **Step 3: Minimal shell changes**

In `app-shell.tsx`: add `aria-label="Sidebar"` to the sidebar `nav`; convert `.sidebar-backdrop` div to `<button type="button" className="sidebar-backdrop" aria-label="Close menu" ...>` (keep the click handler). Restyle sidebar/topbar/notice in `_user.scss` using only `--cms-*` tokens; keep collapse + mobile-drawer layout rules. No behavior changes to navigation filtering or session handling.

- [ ] **Step 4: Run tests and gates**

Run: `pnpm vitest run src/app/shell/` — Expected: PASS (old + new tests).
Run: `pnpm run lint && pnpm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/shell src/styles/_user.scss
git commit -m "style: move shell onto CMS tokens with labelled landmarks"
```

### Task 4: Shared state widgets + PageHeading refresh

**Files:**
- Create: `src/widgets/empty-state.tsx`, `src/widgets/error-state.tsx`, `src/widgets/data-skeleton.tsx`
- Modify: `src/widgets/page-heading.tsx`
- Test: `src/widgets/widgets.test.tsx`

**Interfaces:**
- Consumes: `--cms-*` tokens.
- Produces: `EmptyState({ icon, title, body, action? })`, `ErrorState({ message, onRetry })`, `DataSkeleton({ rows? })` for Phase 2 adoption; refreshed `PageHeading` used by all current consumers.

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Package } from "react-feather";
import EmptyState from "widgets/empty-state";
import ErrorState from "widgets/error-state";
import DataSkeleton from "widgets/data-skeleton";
import PageHeading from "widgets/page-heading";

describe("shared widgets", () => {
  it("empty state shows title, body, and action", () => {
    render(
      <EmptyState
        icon={<Package size={24} />}
        title="No products yet"
        body="This shop has no products."
        action={{ label: "Add your first product", href: "/products/new" }}
      />,
    );
    expect(screen.getByRole("heading", { name: "No products yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add your first product" })).toHaveAttribute(
      "href",
      "/products/new",
    );
  });

  it("error state retries through the provided handler", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Products failed to load." onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("skeleton hides placeholder rows from assistive tech", () => {
    const { container } = render(<DataSkeleton rows={3} />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("page heading renders heading and actions", () => {
    render(<PageHeading heading="Products"><button type="button">New</button></PageHeading>);
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 1: Write the test file above** (`src/widgets/widgets.test.tsx`).
- [ ] **Step 2: Run it** — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement the three widgets + refresh PageHeading** on tokens (empty/error as `role="status"`/`role="alert"`; skeleton `aria-hidden` rows; PageHeading keeps its `heading` + `children` API so all 7 consumers keep working).
- [ ] **Step 4: Run tests + gates** — `pnpm vitest run src/widgets/`, `pnpm run lint`, `pnpm run typecheck`. Expected: clean.
- [ ] **Step 5: Commit**

```bash
git add src/widgets
git commit -m "feat: add shared state widgets and refresh page heading"
```

### Task 5: react-bootstrap reskin on tokens

**Files:**
- Create: `src/styles/cms/_buttons.scss`, `src/styles/cms/_forms.scss`, `src/styles/cms/_tables.scss`, `src/styles/cms/_cards.scss`, `src/styles/cms/_dialogs.scss`, `src/styles/cms/_dropdowns.scss`, `src/styles/cms/_badges.scss`
- Modify: `src/styles/theme.scss` (add the seven imports), `src/styles/_user.scss` (delete rules the skins replace)

**Interfaces:**
- Consumes: `--cms-*` tokens + DESIGN.md component section.
- Produces: every react-bootstrap primitive used by features painted from tokens (kept: `react-bootstrap` dependency and all class APIs — no feature file changes).

- [ ] **Step 1: Skin buttons + forms + badges** (highest-traffic primitives: `.btn-*`, `.form-control/.form-select/.form-check`, `.badge-status` family). Focus-visible rings from tokens; AA ratios in comments.
- [ ] **Step 2: Skin tables + pagination + cards** (`.table`, `thead`, `.table-action-btn`, pager buttons, `.card`).
- [ ] **Step 3: Skin dialogs + dropdowns + alerts** (`.modal-*`, `.dropdown-menu`, `.alert-*` incl. the unusable-session notice).
- [ ] **Step 4: Run gates + build** — `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`. Expected: all green.
- [ ] **Step 5: Commit**

```bash
git add src/styles
git commit -m "style: reskin bootstrap primitives on CMS tokens"
```

### Task 6: Phase 1 verification pass

**Files:** none (verification only; fixes land as `style:` commits).

- [ ] **Step 1: Run all four gates** — `pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`. Record output; fix failures first.
- [ ] **Step 2: Batched visual pass** — dev server + one desktop and one mobile screenshot sweep of shell, navigation (collapsed/expanded), account menu, notice state, and one representative table/form/dialog from current features. Log every defect in one list.
- [ ] **Step 3: Single fix batch** — fix everything on the list in one batch (markup first, tokens second, DESIGN.md updated if a token changes).
- [ ] **Step 4: At most one confirm round** — re-screenshot only the fixed items, then stop. No open-ended polish.
- [ ] **Step 5: Plan the rollout** — write the Phase 2 plan (products module first) as its own plan doc; Phase 1 is done.
