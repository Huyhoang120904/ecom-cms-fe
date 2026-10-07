# ecom-cms-fe contributor guidance

## Ground rules

- This repository is the seller CMS. It is a Next.js (App Router) application written
  in TypeScript, with `src` as the application root.
- Install dependencies with `pnpm` and run scripts with `pnpm run`. Do not add a
  second dependency manager or hand-edit `pnpm-lock.yaml`.
- Never commit `.env`, credentials, tokens, or connection strings.
  `.env.example` holds replaceable placeholders only.
- Run the quality gates before committing:

  ```bash
  pnpm run lint
  pnpm run typecheck
  pnpm run test
  pnpm run build
  ```

## Architecture

```text
src/
├── app/                        # cross-module wiring
│   ├── providers.tsx           # QueryClientProvider and future providers
│   └── shell/                  # the shell and its navigation model
├── features/                   # feature modules, one per seller capability
│   ├── catalog/                # read-only platform metadata a product form is built from
│   ├── dashboard/
│   ├── orders/
│   └── products/
├── lib/                        # global libraries, no feature behavior
│   ├── api/client.ts           # API origin and response/error handling
│   ├── api/envelope.ts         # the `{ "data": ... }` unwrap helper
│   └── query/query-client.ts   # QueryClient construction only
├── layouts/                    # page layouts
├── hooks/                      # shared React hooks
├── widgets/                    # shared presentational components
├── styles/                     # the Bootstrap/SCSS theme
├── types/                      # ambient type declarations
└── pages/                      # Next.js routes; each file is a thin re-export
```

### Module rules

- Query keys, queries, mutations, Zod schemas, domain types, mappings,
  components, and pages belong to the feature module that owns the capability.
- `lib/query/query-client.ts` only constructs the QueryClient. It never contains
  a product, order, or dashboard query definition.
- Routes live in `src/app/` (App Router): a `page.tsx` imports a module's public
  `index.ts` and re-exports its page component, adding no data behavior of its own.
- Components never call `fetch` directly; they call the module's query hooks.
- The mapping file of a module is pure: no I/O, no framework imports.

### Wire types

There is no generated contract. Each feature module hand-writes its `types.ts` from
the backend's own documentation — `ecom-be/docs/contracts/API_CONTRACT_CATALOG.md`
and the pydantic schemas under `app/schemas/` — and every type names the schema it
mirrors. TanStack Query is the whole data layer: `queries.ts` exports `queryOptions`
factories (so a key can never drift from its hook), `mutations.ts` owns invalidation
and any optimistic update, and each module's `api.ts` is the only place its paths
appear. Server state is never mirrored into component state.

Because a rename over there is no longer a compile error over here, the boundary
parses: responses that drive a form or a decision go through a Zod schema, so a
moved field fails loudly as `invalid_response` instead of rendering `undefined`.

## Prohibited

- Global feature queries and ad-hoc `fetch` calls inside components.
- Client-only authorization claims. The backend seller/tenant authorization is
  authoritative; nothing in this repository is a security boundary. `can(...)` and
  the navigation filter are presentation only.
- Invented products, orders, revenue, counts, sellers, or users. Empty states
  must say they are empty.
- Storing the access token anywhere but memory. `lib/auth/session.ts` keeps it in a
  module variable: never `localStorage`, `sessionStorage`, or a readable cookie.
  The refresh token is an httpOnly cookie this application never reads.
- Refreshing a session outside `authFetch` or `refreshSession`. Both are
  single-flight on purpose; a second concurrent refresh presents an
  already-rotated cookie, which the backend correctly reads as token reuse and
  answers by revoking the whole family.
- Rendering an identity the session did not provide. The shell renders the real
  signed-in seller or nothing; there is no placeholder account.

### Session and authorization

A token is minted for exactly one perimeter, and `features/auth/types.ts` mirrors the three:
`storefront` (a buyer, no shop scope), `cms` (a seller inside one shop), `admin` (a platform
administrator, also without a shop). **Login must ask for `cms`** — `toLoginPayload` in
`features/auth/schemas.ts` is the only place that does, and the backend defaults a login to
`storefront`, which every shop route then refuses with `403` even though the same account
owns a shop. Registration is not audience-parameterized: sending `shop_name` is what makes
the new account a seller, so the CMS form keeps it required.

`MePayload.audience` and `MePayload.active_shop` are what decide whether the shell can show
anything. A session the CMS cannot use (a buyer, a platform administrator, or a `cms` token
whose shop is gone) renders the notice in `app/shell/app-shell.tsx` instead of the
navigation, because every link in that navigation would answer `403`. `is_platform_admin`
is surfaced in the account menu: the `sys_admin` role holds every permission by design, so
without the label an ordinary seller would wonder why nothing is hidden.

`AuthProvider` (`features/auth/auth-context.tsx`) performs one silent refresh on
mount, which is the only way a reload recovers a session whose access token lived
in memory. That produces three states, not two: `restoring`, `signed_in`,
`signed_out`. Collapsing `restoring` into `signed_out` would bounce a signed-in
seller to the sign-in form on every reload.

`RouteGuard` (`app/session/route-guard.tsx`) holds the layout while the session is
unresolved and then redirects. `/login` and `/register` are public. This is
convenience, not enforcement: every guarded request is authorized by the backend.

A `401` whose code is `invalid_credentials` is a wrong password, not an ended
session, and must not trigger a refresh. `authFetch` checks the code before
deciding, because rotating the cookie on a mistyped password would replace a
precise error with a confusing one.

### Bounds and envelope

Field bounds live in `lib/auth/constants.ts` and are mirrored from the backend's
declared limits. A schema and its input attributes both read them, so the browser
and the validator never disagree.

Every `2xx` body is `{ "data": ... }` and is read through `unwrapEnvelope`
(`lib/api/envelope.ts`). Errors are not enveloped: they keep `{ error, message }`.
A body that is not an envelope throws `ApiError` with code `invalid_response`
rather than handing `undefined` to a component. A `204` is checked with
`assertOk`, because a rejected delete that resolves would be reported as success.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
