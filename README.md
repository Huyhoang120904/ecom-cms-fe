# ecom-cms-fe

Seller CMS for the ecommerce platform. Next.js (pages router) + TypeScript +
Bootstrap/SCSS theme + TanStack Query + Zod, with module-local data boundaries
and generated OpenAPI types.

The visual base is the [DashUI Next.js admin
template](https://github.com/codescandy/dashui-free-nextjs-admin-template); the
template's demo pages and components were removed so the repository contains only
the seller CMS.

## Requirements

- Node.js 20 or newer
- pnpm 10.33.0 (`packageManager` in `package.json`)
- A running `ecom-be` instance for contract generation and live data

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm run dev` | Start the development server on http://localhost:3000 |
| `pnpm run build` | Production build |
| `pnpm run start` | Serve the production build |
| `pnpm run lint` | ESLint via `next lint` |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run test` | Vitest run |
| `pnpm run api:generate` | Regenerate `src/lib/api/generated.ts` from the backend |

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Origin of `ecom-be`, e.g. `http://localhost:8000` |
| `NEXT_PUBLIC_SITE_URL` | Public origin of this CMS |

Both have development defaults in `src/lib/api/client.ts` and
`scripts/generate-api.mjs`; `.env.example` documents them.

## Contract generation

Start the backend first, then generate the client types:

```bash
cd ../ecom-be && uv run uvicorn ecom_be.main:app --port 8000
cd ../ecom-cms-fe && pnpm run api:generate
```

The command writes `openapi/openapi.json` (a snapshot of the served document) and
`src/lib/api/generated.ts`. The generated file is never hand-edited. If the
backend is unavailable the command exits non-zero with the actual error.

## Current surface

The backend publishes health, identity, and media endpoints. The CMS ships these
routes:

| Route | Content |
|---|---|
| `/login` | Sign in. Public |
| `/register` | Create an account and its first shop. Public |
| `/` | Backend liveness/readiness status and an honest empty operational summary |
| `/profile` | Own profile, avatar, and account deactivation |
| `/shop` | Active shop settings, background, and typed-name retirement |
| `/products` | URL-backed filters, loading skeleton, error state, empty state |
| `/orders` | URL-backed filters, loading skeleton, error state, empty state |

`/api/v1/products` and `/api/v1/orders` do not exist on the backend yet, so the
list pages report the contract's own error instead of showing placeholder rows.
The products and orders modules expose no mutation until the backend publishes a
write endpoint.

## Sessions

Signing in returns an access token that is kept in a module variable and a refresh
token that arrives as an httpOnly cookie. Nothing token-shaped is written to
`localStorage`. On a reload the app performs one silent refresh, which is what makes
a session survive a refresh without ever exposing the refresh token to JavaScript.

Two behaviours are deliberate and easy to break by accident:

- **One refresh at a time.** `refreshSession` is single-flight. Concurrent 401s
  share one call, because a second refresh presents an already-rotated cookie and
  the backend reads that as token reuse, revoking the whole family.
- **`401 invalid_credentials` is not a session problem.** A mistyped password on
  deactivation must surface as a wrong password, not as a session expiry.

The route guard is convenience, not a security boundary. Every guarded request is
authorized by the backend.

## Project structure

See `AGENTS.md` for the full tree, the module ownership rules, and the session and
envelope conventions.
