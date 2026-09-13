import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginForm from "features/auth/components/login-form";
import RegisterForm from "features/auth/components/register-form";

import { jsonResponse, renderWithProviders } from "../helpers";

describe("login form", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("labels every input and shows a helper for the email", () => {
    renderWithProviders(<LoginForm />, { session: null });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/the address you registered with/i)).toBeInTheDocument();
  });

  it("shows the backend's message when the credentials are wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, {
          error: "invalid_credentials",
          message: "Email or password is incorrect",
        }),
      ),
    );
    renderWithProviders(<LoginForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "seller@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "wrong-but-long-enough");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/email or password is incorrect/i)).toBeInTheDocument();
  });

  it("shows the message inside an alert region so it is announced", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(401, { error: "invalid_credentials", message: "Email or password is incorrect" }),
      ),
    );
    renderWithProviders(<LoginForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "seller@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "wrong-but-long-enough");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/email or password is incorrect/i);
  });

  it("disables the submit button and shows a pending label while submitting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWithProviders(<LoginForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "seller@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "a-perfectly-fine-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    const button = await screen.findByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("reports a required field before any request is made", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LoginForm />, { session: null });

    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed email without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<LoginForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.type(screen.getByLabelText(/^password/i), "a-perfectly-fine-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("offers a route to registration", () => {
    renderWithProviders(<LoginForm />, { session: null });

    expect(screen.getByRole("link", { name: /create one/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("returns the seller to the page the guard sent them from", async () => {
    // The guard redirects with `next`, so signing in must honour it rather than
    // always landing on the dashboard.
    const replace = vi.fn();
    const { useRouter } = await import("next/router");
    vi.mocked(useRouter).mockReturnValue({
      pathname: "/login",
      asPath: "/login?next=%2Fproducts",
      query: { next: "/products" },
      route: "/login",
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      reload: vi.fn(),
      isReady: true,
      events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    } as unknown as ReturnType<typeof useRouter>);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          data: {
            access_token: "token-1",
            token_type: "bearer",
            expires_in: 900,
            user: {
              id: "11111111-1111-4111-8111-111111111111",
              email: "seller@example.com",
              full_name: "Nguyen Person",
              created_at: "2026-09-13T00:00:00Z",
            },
            active_shop: {
              id: "22222222-2222-4222-8222-222222222222",
              name: "Hoang Goods",
              slug: "hoang-goods",
            },
            memberships: [],
            permissions: [],
          },
        }),
      ),
    );
    renderWithProviders(<LoginForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "seller@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "a-perfectly-fine-password");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/products"));
  });
});

describe("register form", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("bounds the password at the backend's minimum", () => {
    renderWithProviders(<RegisterForm />, { session: null });

    const password = screen.getByLabelText(/^password/i);
    expect(password).toHaveAttribute("minlength", "12");
    expect(password).toHaveAttribute("maxlength", "128");
  });

  it("bounds the shop name and the full name", () => {
    renderWithProviders(<RegisterForm />, { session: null });

    expect(screen.getByLabelText(/shop name/i)).toHaveAttribute("maxlength", "80");
    expect(screen.getByLabelText(/your name/i)).toHaveAttribute("maxlength", "120");
  });

  it("bounds the email at the RFC length", () => {
    renderWithProviders(<RegisterForm />, { session: null });

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("maxlength", "254");
  });

  it("uses the right autocomplete hints so a password manager fills them", () => {
    renderWithProviders(<RegisterForm />, { session: null });

    expect(screen.getByLabelText(/email/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("autocomplete", "new-password");
  });

  it("reports a short password before any request is made", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<RegisterForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "seller@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "elevenchars");
    await userEvent.type(screen.getByLabelText(/your name/i), "Nguyen Person");
    await userEvent.type(screen.getByLabelText(/shop name/i), "Hoang Goods");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/use at least 12 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces a taken email as the backend's message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(409, { error: "email_taken", message: "That email is already registered" }),
      ),
    );
    renderWithProviders(<RegisterForm />, { session: null });

    await userEvent.type(screen.getByLabelText(/email/i), "seller@example.com");
    await userEvent.type(screen.getByLabelText(/^password/i), "a-perfectly-fine-password");
    await userEvent.type(screen.getByLabelText(/your name/i), "Nguyen Person");
    await userEvent.type(screen.getByLabelText(/shop name/i), "Hoang Goods");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/that email is already registered/i)).toBeInTheDocument();
  });

  it("states the minimum length as helper text rather than only on failure", () => {
    renderWithProviders(<RegisterForm />, { session: null });

    expect(screen.getByText(/at least 12 characters/i)).toBeInTheDocument();
  });

  it("offers a route back to sign-in", () => {
    renderWithProviders(<RegisterForm />, { session: null });

    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute("href", "/login");
  });
});
