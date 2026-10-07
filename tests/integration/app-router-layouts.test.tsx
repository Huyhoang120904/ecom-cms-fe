import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthLayout from "app/(auth)/layout";
import CmsLayout from "app/(cms)/layout";

vi.mock("app/session/route-guard", () => ({
  ProtectedRouteGuard: ({ children }: { children: ReactNode }) => (
    <div data-testid="protected-guard">{children}</div>
  ),
  PublicRouteGuard: ({ children }: { children: ReactNode }) => (
    <div data-testid="public-guard">{children}</div>
  ),
}));

vi.mock("app/shell/app-shell", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe("App Router route-group layouts", () => {
  it("wraps protected routes in the CMS shell", () => {
    render(<CmsLayout><p>dashboard</p></CmsLayout>);

    expect(screen.getByTestId("protected-guard")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });

  it("keeps public auth routes outside the CMS shell", () => {
    render(<AuthLayout><p>sign in</p></AuthLayout>);

    expect(screen.getByTestId("public-guard")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
  });
});
