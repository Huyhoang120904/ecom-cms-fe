# Next.js 16 App Router Migration Design

## Objective

Upgrade the seller CMS from Next.js 13.2 and React 18 to the latest stable Next.js
16 release and its compatible dependency stack, replace the Pages Router with the
App Router, and preserve the current URLs, authentication behavior, UI, mock data,
tests, production build, and static GitHub Pages deployment.

## Constraints

- Preserve the user's existing uncommitted UI and identity work.
- Keep pnpm 10.33.0 as the only package manager and regenerate `pnpm-lock.yaml`.
- Pin Next.js to the latest 16.x release rather than crossing into a future major.
- Use React 19 and the Next.js 16 default Turbopack build.
- Require Node.js 22.12 or newer because the current Vitest/Vite toolchain requires
  it, even though Next.js itself only requires Node.js 20.9.
- Keep the access token in memory and preserve single-flight refresh semantics.
- Keep backend authorization authoritative; client route guards remain a UX layer.
- Do not change public URLs or API contracts.

## Routing Architecture

`src/app/layout.tsx` is the root Server Component. It owns `<html>`, `<body>`,
global Sass, favicon metadata, and the client provider boundary. Route groups keep
public and protected layouts separate without changing URLs:

```text
src/app/
├── layout.tsx
├── not-found.tsx
├── providers.tsx
├── (auth)/
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── register/page.tsx
└── (cms)/
    ├── layout.tsx
    ├── page.tsx
    ├── orders/page.tsx
    ├── products/page.tsx
    ├── products/[id]/page.tsx
    ├── profile/page.tsx
    └── shop/page.tsx
```

The auth layout applies the signed-in redirect without rendering the CMS shell.
The CMS layout applies the signed-out redirect and renders `AppShell`. Both use the
same `AuthProvider` beneath the root Query Client provider. The old `src/pages`
tree is removed after all App Router routes exist.

## Client and Server Boundaries

Route files and metadata remain Server Components where possible. Existing feature
components that use hooks, browser APIs, React Query, React Bootstrap interaction,
or auth context become explicit Client Components. The boundary is placed at the
highest reusable interactive component, not indiscriminately on every file.

The product detail route receives Next.js 16's asynchronous `params` prop in its
server page, awaits it, and passes a plain `productId` string to the client detail
component. `generateStaticParams` emits all mock product IDs and supports the static
deployment build.

## Navigation Migration

Every `next/router` consumer moves to `next/navigation`:

- `usePathname()` replaces `router.pathname`.
- `useSearchParams()` replaces `router.query` for query strings.
- `useParams()` or server `params` replaces dynamic route query fields.
- `useRouter().replace(string)` replaces object-form replacements.
- Redirect targets preserve the current `next` query parameter.

Product and order filter state remains immediately responsive. URL updates clone
the current `URLSearchParams`, set or remove the changed fields, reset `page=1`,
and call `router.replace()` with the resulting URL.

## Dependency and Tooling Policy

- Next.js and `eslint-config-next`: 16.3.5.
- React, React DOM, and their types: 19.3.0.
- ESLint: latest 9.x, using `eslint.config.mjs`; `next lint` is removed in Next 16.
- Bootstrap, React Bootstrap, TanStack Query, SimpleBar React, Sass, testing, OpenAPI,
  and schema packages move to their latest compatible stable releases.
- TypeScript remains on the stable 5.9 line unless the installed Next 16 toolchain
  proves TypeScript 7 compatible during verification.
- Dependencies with no source, config, or script references are removed after an
  import audit (`apexcharts`, `next-seo`, `react-responsive`, and direct `simplebar`).
- Add direct `vite` and `@testing-library/dom` development dependencies required by
  the current Vitest and Testing Library peer contracts.

## Configuration and Linting

`next.config.js` drops the empty experimental block. Normal builds remain server
builds suitable for `next start`. Setting `NEXT_OUTPUT=export` switches to
`output: "export"` and unoptimized images for GitHub Pages without weakening the
normal build.

The legacy `.eslintrc.json` is replaced by an ESLint flat config that extends
`eslint-config-next/core-web-vitals` and ignores generated/build directories. The
lint script becomes `eslint .`; builds no longer implicitly lint in Next 16.

TypeScript uses bundler-aware module resolution and the Next.js plugin while
retaining strictness, path aliases, and test inclusion. Generated Next route types
are included after the first build/type generation.

## Static Deployment and CI

The quality workflow uses Node 22 and pnpm with frozen lockfile installation. The
GitHub Pages workflow is converted from Node 16/npm/removed `next export` to Node
22/pnpm and `NEXT_OUTPUT=export pnpm build`, which emits `out/`. Dynamic product
routes are supplied by `generateStaticParams`; image optimization is disabled only
for the export build.

## Testing and Verification

Tests replace global `next/router` mocks with `next/navigation` mocks and cover:

- protected and public guard redirects,
- shell visibility by route group,
- pathname-based active navigation,
- search parameter filtering and URL replacement,
- dynamic product parameter handoff and static parameter generation.

The migration is complete only when all of these succeed from the upgraded lockfile:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
NEXT_OUTPUT=export pnpm build
pnpm dev (route smoke test)
```

## Rollback

All work is an in-place source migration with no backend or persistent-data changes.
Rollback consists of reverting the migration files and lockfile. Existing unrelated
worktree changes are not reset, rewritten, or included in cleanup operations.
