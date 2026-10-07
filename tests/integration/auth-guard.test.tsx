import { render, screen, waitFor } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RouteGuard from "app/session/route-guard";
import { AuthProvider, useAuth } from "features/auth/auth-context";

import { jsonResponse, meBody, renderWithProviders } from "../helpers";

function routerMock() {
  return {
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    back: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  };
}

function Probe() {
  const { status, session } = useAuth();
  return (
    <p>
      status:{status} email:{session?.user.email ?? "none"}
    </p>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(usePathname).mockReturnValue("/");
    vi.mocked(useRouter).mockReturnValue(
      routerMock() as unknown as ReturnType<typeof useRouter>,
    );
  });

  it("renders the restoring state before the silent refresh resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWithProviders(<Probe />, { withAuthProvider: true });

    expect(screen.getByText(/status:restoring/)).toBeInTheDocument();
  });

  it("reports signed_out when there is no refresh cookie", async () => {
    // A first-time visitor has no cookie, so `/auth/refresh` answers 401 for a
    // perfectly normal reason. That must not read as an ended session.
    vi.mocked(usePathname).mockReturnValue("/");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(401, { error: "invalid_token", message: "No" })),
    );
    renderWithProviders(<Probe />, { withAuthProvider: true });

    await waitFor(() => expect(screen.getByText(/status:signed_out/)).toBeInTheDocument());
  });

  it("reports signed_in and exposes the session's email", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { access_token: "fresh" } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: meBody }));
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<Probe />, { withAuthProvider: true });

    await waitFor(() =>
      expect(screen.getByText(/status:signed_in email:seller@example.com/)).toBeInTheDocument(),
    );
  });
});

describe("RouteGuard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("holds the content while the session is being restored", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );

    renderWithProviders(
      <RouteGuard>
        <p>secret dashboard</p>
      </RouteGuard>,
      { withAuthProvider: true },
    );

    expect(screen.queryByText("secret dashboard")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects a signed-out visitor away from a guarded page, preserving the target", async () => {
    const router = routerMock();
    vi.mocked(usePathname).mockReturnValue("/products");
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);

    renderWithProviders(
      <RouteGuard>
        <p>secret dashboard</p>
      </RouteGuard>,
      { session: null },
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/login?next=%2Fproducts"),
    );
    expect(screen.queryByText("secret dashboard")).not.toBeInTheDocument();
  });

  it("does not redirect a signed-out visitor who is already on the sign-in page", () => {
    const router = routerMock();
    vi.mocked(usePathname).mockReturnValue("/login");
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);

    renderWithProviders(
      <RouteGuard>
        <p>sign in form</p>
      </RouteGuard>,
      { session: null },
    );

    expect(screen.getByText("sign in form")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sends a signed-in seller from the sign-in page to the dashboard", async () => {
    const router = routerMock();
    vi.mocked(usePathname).mockReturnValue("/login");
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);

    renderWithProviders(
      <RouteGuard>
        <p>sign in form</p>
      </RouteGuard>,
      { session: meBody },
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByText("sign in form")).not.toBeInTheDocument();
  });

  it("renders a guarded page for a signed-in seller", () => {
    const router = routerMock();
    vi.mocked(usePathname).mockReturnValue("/products");
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);

    renderWithProviders(
      <RouteGuard>
        <p>product table</p>
      </RouteGuard>,
      { session: meBody },
    );

    expect(screen.getByText("product table")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("useAuth", () => {
  it("throws outside the provider instead of returning a default session", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    function Naked() {
      useAuth();
      return null;
    }

    // A silent default would render a shell with no identity and no redirect.
    expect(() => render(<Naked />)).toThrow(/useAuth must be used inside AuthProvider/);
    quiet.mockRestore();
  });
});
