import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Testing Library only auto-registers cleanup when vitest globals are enabled, and
// this project sets `globals: false`. Without this, every render stays in the
// document and a later `queryByText` can match an element from an earlier test,
// making results depend on file order.
afterEach(cleanup);

// The session provider and the route guard both call `useRouter`, so a component
// test would otherwise need a real Next router. This mock returns a signed-out,
// root-path location by default; a test that cares about a specific path can
// override it with `vi.mocked(useRouter).mockReturnValue(...)`.
vi.mock("next/router", () => ({
  useRouter: vi.fn(() => ({
    pathname: "/",
    asPath: "/",
    query: {},
    route: "/",
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    reload: vi.fn(),
    isReady: true,
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  })),
}));
