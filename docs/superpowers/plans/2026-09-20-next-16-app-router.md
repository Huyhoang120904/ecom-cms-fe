# Next.js 16 App Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the seller CMS to Next.js 16.3.5 and React 19.3.0, migrate every route to the App Router, modernize dependencies/tooling/CI, and retain current behavior.

**Architecture:** A Server Component root layout owns document metadata and global styles. Client provider and authentication boundaries wrap separate `(auth)` and `(cms)` route-group layouts; existing feature components stay module-local and interactive components explicitly declare `"use client"`.

**Tech Stack:** Next.js 16.3.5, React 19.3, TypeScript 5.9, TanStack Query 5, Bootstrap/React Bootstrap, Sass, ESLint 9 flat config, Vitest 5, Vite 8, pnpm 10.

**Spec:** `docs/superpowers/specs/2026-09-20-next-16-app-router-design.md`

## Global Constraints

- Preserve all existing uncommitted UI and identity changes.
- Keep current public URLs and backend contracts unchanged.
- Require Node.js 22.12 or newer and pnpm 10.33.0.
- Pin Next.js and `eslint-config-next` to 16.3.5 and React packages to 19.3.0.
- Use Turbopack for development and production builds.
- Keep the normal server build and the opt-in `NEXT_OUTPUT=export` static build working.
- Do not commit or reset unrelated worktree changes.

---

### Task 1: Upgrade dependencies and lint configuration

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `next.config.js`
- Modify: `tsconfig.json`
- Delete: `.eslintrc.json`
- Create: `eslint.config.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: Node 22-compatible Next 16 toolchain and `pnpm lint` via ESLint CLI.
- Consumes: existing pnpm package manager declaration.

- [ ] **Step 1: Capture the pre-upgrade baseline**

Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` and record any failure that predates dependency changes.

- [ ] **Step 2: Replace dependency versions and remove audited unused packages**

Set `engines.node` to `>=22.12.0`, update the Next/React/tooling dependencies from the spec, add direct Vite and Testing Library DOM peers, and remove `apexcharts`, `next-seo`, `react-responsive`, and direct `simplebar`.

- [ ] **Step 3: Install with pnpm and regenerate the lockfile**

Run `pnpm install`. Do not edit `pnpm-lock.yaml` manually.

- [ ] **Step 4: Replace legacy ESLint configuration**

Create `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "coverage/**", "src/lib/api/generated.ts"]),
]);
```

Set `scripts.lint` to `eslint .`.

- [ ] **Step 5: Update Next, TypeScript, and CI runtime configuration**

Make export mode conditional in `next.config.js`, add Next's TypeScript plugin and bundler module resolution, and move CI to Node 22.

- [ ] **Step 6: Run lint and typecheck to expose migration errors**

Run `pnpm lint` and `pnpm typecheck`. Expected: failures point to App Router/client-boundary work, not missing packages or invalid configuration.

### Task 2: Create the App Router root and route groups

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(cms)/layout.tsx`
- Modify: `src/app/providers.tsx`
- Modify: `src/app/session/route-guard.tsx`
- Test: `tests/integration/app-router-layouts.test.tsx`

**Interfaces:**
- Produces: `ProtectedRouteGuard`, `PublicRouteGuard`, root metadata, authenticated shell boundary.
- Consumes: `AuthProvider`, `AppProviders`, `AppShell`.

- [ ] **Step 1: Write failing layout and guard tests**

Test that the CMS layout renders `AppShell`, the auth layout does not, a signed-out protected route calls `replace('/login?next=...')`, and a signed-in auth route calls `replace('/')`.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run `pnpm test -- tests/integration/app-router-layouts.test.tsx`. Expected: missing App Router layouts/guard exports.

- [ ] **Step 3: Add explicit client provider and guard boundaries**

Add `"use client"` to providers and guard code. Replace `next/router` with `usePathname`, `useSearchParams`, and `useRouter` from `next/navigation`.

- [ ] **Step 4: Add root and route-group layouts**

The root layout imports `styles/theme.scss`, exports `Metadata`, and wraps children in `AppProviders` and `AuthProvider`. `(auth)/layout.tsx` uses `PublicRouteGuard`; `(cms)/layout.tsx` uses `ProtectedRouteGuard` and `AppShell`.

- [ ] **Step 5: Run focused tests**

Run `pnpm test -- tests/integration/app-router-layouts.test.tsx`. Expected: pass.

### Task 3: Migrate all pages and navigation APIs

**Files:**
- Create: `src/app/(cms)/page.tsx`
- Create: `src/app/(cms)/orders/page.tsx`
- Create: `src/app/(cms)/products/page.tsx`
- Create: `src/app/(cms)/products/[id]/page.tsx`
- Create: `src/app/(cms)/profile/page.tsx`
- Create: `src/app/(cms)/shop/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Modify: all source files importing `next/router`
- Modify: interactive source files requiring client boundaries
- Test: existing source and integration tests

**Interfaces:**
- Produces: the same `/`, `/orders`, `/products`, `/products/[id]`, `/profile`, `/shop`, `/login`, and `/register` URLs.
- Consumes: feature page components and `MOCK_PRODUCTS` for static parameters.

- [ ] **Step 1: Update navigation test mocks to `next/navigation` and verify they fail**

Mock `useRouter`, `usePathname`, `useSearchParams`, and `useParams` in `tests/setup.ts`; update tests that override the router. Run `pnpm test` and confirm source imports still fail against the new contract.

- [ ] **Step 2: Replace source router APIs**

Use string URLs for `router.replace`, preserve `next`, and centralize query-string cloning in product/order page helpers.

- [ ] **Step 3: Add client directives at real interactive boundaries**

Mark provider, context, guard, shell, forms, dialogs, filter/list pages, and React Query hook consumers as clients. Keep pure schemas, API functions, mappings, and static route wrappers server-compatible.

- [ ] **Step 4: Add route files**

Thin route components import the existing feature components. The dynamic product route awaits `params` and passes `productId`; it exports:

```ts
export function generateStaticParams() {
  return MOCK_PRODUCTS.map(({ id }) => ({ id }));
}
```

- [ ] **Step 5: Run tests and typecheck**

Run `pnpm test && pnpm typecheck`. Expected: all tests pass and no `next/router` imports remain.

### Task 4: Remove Pages Router and finalize metadata/static export

**Files:**
- Delete: `src/pages/_app.tsx`
- Delete: `src/pages/_document.tsx`
- Delete: all route files under `src/pages/`
- Modify: `next.config.js`
- Modify: `.github/workflows/nextjs.yml`
- Test: production and static builds

**Interfaces:**
- Produces: App Router-only route manifest and `out/` when `NEXT_OUTPUT=export`.
- Consumes: `generateStaticParams` from the product route and conditional image configuration.

- [ ] **Step 1: Confirm App Router route parity**

Run `find src/app -path '*/page.tsx' -o -name layout.tsx` and compare against the existing route table before deleting Pages Router files.

- [ ] **Step 2: Remove the old Pages Router files**

Delete only the known files under `src/pages`; do not remove feature components or shared app wiring.

- [ ] **Step 3: Rewrite the Pages deployment workflow**

Use pnpm/action-setup v4, actions/setup-node v4 with Node 22, frozen installation, and `NEXT_OUTPUT=export pnpm build`; upload `out/`. Remove the obsolete `next export` step.

- [ ] **Step 4: Verify both build modes**

Run `pnpm build`, then `NEXT_OUTPUT=export pnpm build`. Expected: both succeed and the static build contains HTML for each mock product ID.

### Task 5: Documentation and full verification

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Test: all quality gates and smoke routes

**Interfaces:**
- Produces: accurate App Router/Node/tooling documentation.
- Consumes: final scripts and route structure.

- [ ] **Step 1: Update project documentation**

Document App Router structure, Node 22.12 minimum, React 19, ESLint CLI, static export behavior, and current mock product/order surfaces.

- [ ] **Step 2: Run all quality gates from the final lockfile**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
NEXT_OUTPUT=export pnpm build
git diff --check
```

- [ ] **Step 3: Smoke-test development routes**

Start `pnpm dev`, request `/`, `/login`, `/register`, `/products`, `/products/<known-id>`, and `/orders`, and confirm successful HTML responses with no terminal compilation errors.

- [ ] **Step 4: Review the final diff**

Confirm only migration files and the user's pre-existing changes are present; report verification evidence and any remaining external deployment caveat.
