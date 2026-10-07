import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShopSettingsForm from "features/shop/components/shop-settings-form";

import { jsonResponse, renderWithProviders, sessionFixture } from "../helpers";

const SHOP = sessionFixture.active_shop!;

function lastBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const call = fetchMock.mock.calls.at(-1) as [string, RequestInit] | undefined;
  return JSON.parse((call?.[1]?.body as string) ?? "{}") as Record<string, unknown>;
}

describe("shop settings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the slug as read-only and explains that it does not change", () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    expect(screen.getByText(SHOP.slug!)).toBeInTheDocument();
    expect(screen.getByText(/does not change when you rename the shop/i)).toBeInTheDocument();
    // Not an editable field at all, so it cannot be posted by accident.
    expect(screen.queryByLabelText(/^slug$/i)).not.toBeInTheDocument();
  });

  it("bounds the description and the website", () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    expect(screen.getByLabelText(/description/i)).toHaveAttribute("maxlength", "300");
    expect(screen.getByLabelText(/website/i)).toHaveAttribute("maxlength", "255");
  });

  it("bounds the name, contact email, and contact phone", () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    expect(screen.getByLabelText(/shop name/i)).toHaveAttribute("maxlength", "80");
    expect(screen.getByLabelText(/contact email/i)).toHaveAttribute("maxlength", "254");
    expect(screen.getByLabelText(/contact phone/i)).toHaveAttribute("maxlength", "32");
  });

  it("seeds the fields from the active shop", () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    expect(screen.getByLabelText(/shop name/i)).toHaveValue("Hoang Goods");
    expect(screen.getByLabelText(/website/i)).toHaveValue("https://hoang-goods.example");
  });

  it("refuses a website without a scheme", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    await userEvent.clear(screen.getByLabelText(/website/i));
    await userEvent.type(screen.getByLabelText(/website/i), "example.com");
    await userEvent.click(screen.getByRole("button", { name: /save shop/i }));

    expect(await screen.findByText(/including http:\/\/ or https:\/\//i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only the fields that changed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { data: { ...SHOP, name: "Renamed" } }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    await userEvent.clear(screen.getByLabelText(/shop name/i));
    await userEvent.type(screen.getByLabelText(/shop name/i), "Renamed");
    await userEvent.click(screen.getByRole("button", { name: /save shop/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(Object.keys(lastBody(fetchMock))).toEqual(["name"]);
  });

  it("shows a persisted success state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { data: { ...SHOP, name: "Renamed" } })),
    );
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    await userEvent.clear(screen.getByLabelText(/shop name/i));
    await userEvent.type(screen.getByLabelText(/shop name/i), "Renamed");
    await userEvent.click(screen.getByRole("button", { name: /save shop/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/shop saved/i);
  });

  it("refuses an oversized background before making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    const big = new File([new Uint8Array(2_097_153)], "big.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText(/background image file/i), big);

    expect(await screen.findByText(/larger than 2 MB/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("states the crop so the aspect ratio is not a surprise", () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    expect(screen.getByText(/cropped to 16:9/i)).toBeInTheDocument();
  });

  it("renders an empty surface rather than a broken image when there is no background", () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    expect(screen.getByText(/no background yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove background/i })).toBeDisabled();
  });

  it("requires the exact shop name before deleting", async () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /^delete shop$/i }));
    const confirmButton = screen.getByRole("button", { name: /delete this shop/i });
    expect(confirmButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/type the shop name/i), "Hoang Good");
    expect(confirmButton).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/type the shop name/i), "s");
    expect(confirmButton).toBeEnabled();
  });

  it("states that the shop's data is retained, not destroyed", async () => {
    renderWithProviders(<ShopSettingsForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /^delete shop$/i }));

    expect(screen.getByText(/data is retained/i)).toBeInTheDocument();
  });

  it("hides the editor from a role without shop:update and says why", () => {
    renderWithProviders(<ShopSettingsForm />, {
      session: { ...sessionFixture, permissions: ["dashboard:read", "shop:read"] },
    });

    expect(screen.queryByLabelText(/shop name/i)).not.toBeInTheDocument();
    expect(screen.getByText(/does not include editing its settings/i)).toBeInTheDocument();
  });

  it("renders nothing without a session", () => {
    renderWithProviders(<ShopSettingsForm />, { session: null });

    expect(screen.queryByLabelText(/shop name/i)).not.toBeInTheDocument();
  });
});
