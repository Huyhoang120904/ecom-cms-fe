import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("features/auth/auth-context", () => ({
  useAuth: () => ({ session: null, can: () => false }),
}));
vi.mock("features/auth/mutations", () => ({
  useLogoutMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useSwitchShopMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

import AppShell from "app/shell/app-shell";

describe("shell accessibility", () => {
  it("labels the sidebar and turns the mobile backdrop into a real button", async () => {
    render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /open menu/i }));

    const backdrop = screen.getByRole("button", { name: /close navigation menu/i });
    expect(backdrop).toHaveClass("sidebar-backdrop");

    await userEvent.click(backdrop);
    expect(
      screen.queryByRole("button", { name: /close navigation menu/i }),
    ).not.toBeInTheDocument();
  });
});
