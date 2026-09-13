/**
 * Shared test harness.
 *
 * One `renderWithProviders` signature and one set of fixtures, so a component test
 * states only what it is actually testing.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { AuthContext, AuthProvider, type AuthValue } from "features/auth/auth-context";
import type { MePayload } from "features/auth/types";
import { clearSession, setAccessToken } from "lib/auth/session";

/** A response the way the backend sends it: envelope, status, JSON content type. */
export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const meBody: MePayload = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "seller@example.com",
    full_name: "Nguyen Person",
    bio: "I sell lamps.",
    phone: "+13128471928",
    job_title: "Owner",
    avatar_url: null,
    created_at: "2026-09-13T00:00:00Z",
    last_login_at: "2026-09-13T09:00:00Z",
  },
  active_shop: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Hoang Goods",
    slug: "hoang-goods",
    description: "Lamps and shades.",
    contact_email: "hello@hoang-goods.example",
    contact_phone: "+13128471928",
    website: "https://hoang-goods.example",
    background_url: null,
  },
  memberships: [
    {
      shop: {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Hoang Goods",
        slug: "hoang-goods",
        description: "Lamps and shades.",
        contact_email: "hello@hoang-goods.example",
        contact_phone: "+13128471928",
        website: "https://hoang-goods.example",
        background_url: null,
      },
      role: { key: "owner", name: "Owner" },
    },
  ],
  permissions: ["dashboard:read", "products:read", "orders:read", "shop:read", "shop:update"],
};

/**
 * The session the component tests use. `sessionFixture` is the name the
 * per-component tests in later tasks refer to.
 */
export const sessionFixture = meBody;

export interface RenderOptions {
  /** Render a real AuthProvider around the node instead of injecting the session. */
  withAuthProvider?: boolean;
  /** The session the injected provider reports. Defaults to `meBody`. */
  session?: MePayload | null;
}

export function renderWithProviders(node: ReactNode, options: RenderOptions = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  // Module-level session state persists between tests in one file. A test that
  // leaves a refresh hanging would otherwise wedge every later test, so each render
  // starts from a clean slate.
  clearSession();

  if (options.withAuthProvider) {
    return render(
      <QueryClientProvider client={client}>
        <AuthProvider>{node}</AuthProvider>
      </QueryClientProvider>,
    );
  }

  // Inject the session without a network round-trip: seed the cache key the
  // provider reads, and hold a token so `authFetch` has one.
  const session = options.session === undefined ? meBody : options.session;
  if (session) {
    client.setQueryData(["auth", "me"], session);
    setAccessToken("test-token");
  } else {
    setAccessToken(null);
  }

  return render(
    <QueryClientProvider client={client}>
      <AuthTestProvider
        value={{
          status: session ? "signed_in" : "signed_out",
          session,
          // Mirrors the provider: presentation only, derived from the session's own
          // permissions so a test asserting a hidden control stays honest.
          can: (permission) => session?.permissions.includes(permission) ?? false,
        }}
      >
        {node}
      </AuthTestProvider>
    </QueryClientProvider>,
  );
}

/** The real provider's context value, set directly so no refresh is attempted. */
function AuthTestProvider({ value, children }: { value: AuthValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
