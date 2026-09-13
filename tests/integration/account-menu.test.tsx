import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AccountMenu from "app/shell/account-menu";
import ShellNavigation from "app/shell/shell-navigation";
import { initials } from "features/auth/components/avatar";

import { renderWithProviders, sessionFixture } from "../helpers";


/** Open the account menu the way a seller does, since it renders on demand. */
async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: /account|nguyen person|np/i }));
}

describe("initials", () => {
  it("takes the first letter of the first and last word", () => {
    expect(initials("Nguyen Person")).toBe("NP");
  });

  it("handles a single-word name without producing an empty monogram", () => {
    expect(initials("Prince")).toBe("PR");
  });

  it("handles extra whitespace", () => {
    expect(initials("  Nguyen   Van   Person  ")).toBe("NP");
  });

  it("falls back to a visible character for an empty name", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("account menu", () => {
  it("shows the real signed-in email and the active shop", async () => {
    renderWithProviders(<AccountMenu />, { session: sessionFixture });

    await openMenu();

    expect(await screen.findByText("seller@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("Hoang Goods").length).toBeGreaterThan(0);
  });

  it("renders a monogram when the account has no avatar", () => {
    renderWithProviders(<AccountMenu />, { session: sessionFixture });

    expect(screen.getByText("NP")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("renders the avatar image at reserved dimensions when one exists", () => {
    renderWithProviders(<AccountMenu />, {
      session: {
        ...sessionFixture,
        user: { ...sessionFixture.user, avatar_url: "http://api/avatars/x.webp" },
      },
    });

    // Queried by tag, not by role: an `alt=""` image is decorative, so it has no
    // `img` role. That is the point of the empty alt below.
    const image = document.querySelector("img");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("width", "32");
    expect(image).toHaveAttribute("height", "32");
    // Empty on purpose: the name sits beside it as text, so a description here
    // would make a screen reader announce it twice.
    expect(image).toHaveAttribute("alt", "");
  });

  it("hides the switcher for a single membership", async () => {
    renderWithProviders(<AccountMenu />, { session: sessionFixture });

    await openMenu();

    expect(screen.queryByLabelText(/switch shop/i)).not.toBeInTheDocument();
  });

  it("shows the switcher for two memberships and reports the choice", async () => {
    const onSwitch = vi.fn();
    renderWithProviders(<AccountMenu onSwitchShop={onSwitch} />, {
      session: {
        ...sessionFixture,
        memberships: [
          { shop: sessionFixture.active_shop, role: { key: "owner", name: "Owner" } },
          {
            shop: { ...sessionFixture.active_shop, id: "shop-2", name: "Second Shop" },
            role: { key: "viewer", name: "Viewer" },
          },
        ],
      },
    });

    await openMenu();
    await userEvent.click(screen.getByRole("button", { name: /second shop/i }));

    expect(onSwitch).toHaveBeenCalledWith("shop-2");
  });

  it("marks the current shop and disables its own button", async () => {
    renderWithProviders(<AccountMenu />, {
      session: {
        ...sessionFixture,
        memberships: [
          { shop: sessionFixture.active_shop, role: { key: "owner", name: "Owner" } },
          {
            shop: { ...sessionFixture.active_shop, id: "shop-2", name: "Second Shop" },
            role: { key: "viewer", name: "Viewer" },
          },
        ],
      },
    });

    await openMenu();
    // Scoped by aria-current, because the shop name also appears in the toggle.
    const current = document.querySelector('[aria-current="true"]');
    expect(current).not.toBeNull();
    expect(current).toBeDisabled();
  });

  it("offers shop settings only when shop:update is held", async () => {
    renderWithProviders(<AccountMenu />, { session: sessionFixture });

    await openMenu();

    expect(await screen.findByRole("link", { name: /shop settings/i })).toBeInTheDocument();
  });

  it("hides shop settings from a role without shop:update", async () => {
    renderWithProviders(<AccountMenu />, {
      session: { ...sessionFixture, permissions: ["dashboard:read"] },
    });

    await openMenu();

    expect(screen.queryByRole("link", { name: /shop settings/i })).not.toBeInTheDocument();
  });

  it("renders nothing rather than a placeholder identity when there is no session", () => {
    renderWithProviders(<AccountMenu />, { session: null });

    expect(screen.queryByText(/not signed in/i)).not.toBeInTheDocument();
  });
});

describe("shell navigation", () => {
  it("shows every item an unrestricted account can use", () => {
    renderWithProviders(<ShellNavigation />, { session: sessionFixture });

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /orders/i })).toBeInTheDocument();
  });

  it("hides a nav item the account cannot use", () => {
    // Presentation only, so the shell does not offer a page that would immediately
    // fail. The backend still refuses the request.
    renderWithProviders(<ShellNavigation />, {
      session: { ...sessionFixture, permissions: ["dashboard:read"] },
    });

    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /products/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /orders/i })).not.toBeInTheDocument();
  });

  it("does not render a nav link for a missing session", () => {
    renderWithProviders(<ShellNavigation />, { session: null });

    expect(screen.queryByRole("link", { name: /dashboard/i })).not.toBeInTheDocument();
  });
});
