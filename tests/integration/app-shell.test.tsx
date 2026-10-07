import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AppShell from "app/shell/app-shell";

import { renderWithProviders, sessionFixture } from "../helpers";

describe("application shell header", () => {
  it("keeps the account control in the header instead of the sidebar footer", () => {
    renderWithProviders(
      <AppShell>
        <p>Dashboard content</p>
      </AppShell>,
      { session: sessionFixture },
    );

    const header = screen.getByRole("banner");
    const sidebar = screen.getByRole("navigation", { name: "Sidebar" });

    expect(within(header).getByRole("button", { name: /nguyen person/i })).toBeInTheDocument();
    expect(within(header).getByText("Sign out")).toBeInTheDocument();
    expect(within(sidebar).queryByRole("button", { name: /nguyen person/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /nguyen person/i })).toHaveLength(1);
  });

  it("gives the sidebar scroll region the full viewport height", () => {
    renderWithProviders(
      <AppShell>
        <p>Dashboard content</p>
      </AppShell>,
      { session: sessionFixture },
    );

    const sidebar = screen.getByRole("navigation", { name: "Sidebar" });
    const scrollRegion = sidebar.querySelector("[data-simplebar]");

    expect(scrollRegion).toHaveStyle({ height: "100%" });
  });
});

describe("shell with a session the CMS cannot use", () => {
  it("explains a buyer session instead of rendering navigation that would 403", () => {
    renderWithProviders(
      <AppShell>
        <p>Dashboard content</p>
      </AppShell>,
      { session: { ...sessionFixture, audience: "storefront", active_shop: null } },
    );

    expect(screen.getByRole("heading", { name: /not a seller session/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/signed in as a buyer/i);
    // No sidebar and no page content: every shop request would be refused.
    expect(screen.queryByRole("navigation", { name: "Sidebar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out and use a seller account/i }),
    ).toBeInTheDocument();
  });

  it("explains a platform administrator session, which carries no shop", () => {
    renderWithProviders(
      <AppShell>
        <p>Dashboard content</p>
      </AppShell>,
      { session: { ...sessionFixture, audience: "admin", active_shop: null, is_platform_admin: true } },
    );

    expect(screen.getByRole("status")).toHaveTextContent(/platform administrator/i);
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("explains a cms session whose shop is no longer available", () => {
    renderWithProviders(
      <AppShell>
        <p>Dashboard content</p>
      </AppShell>,
      { session: { ...sessionFixture, active_shop: null } },
    );

    expect(screen.getByRole("status")).toHaveTextContent(/no active shop/i);
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });
});
