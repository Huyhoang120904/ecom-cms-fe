import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfileForm from "features/auth/components/profile-form";

import { jsonResponse, meBody, renderWithProviders, sessionFixture } from "../helpers";

function lastBody(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const call = fetchMock.mock.calls.at(-1) as [string, RequestInit] | undefined;
  return JSON.parse((call?.[1]?.body as string) ?? "{}") as Record<string, unknown>;
}

describe("profile form", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("bounds every field the way the backend does", () => {
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    expect(screen.getByLabelText(/bio/i)).toHaveAttribute("maxlength", "500");
    expect(screen.getByLabelText(/job title/i)).toHaveAttribute("maxlength", "80");
    expect(screen.getByLabelText(/your name/i)).toHaveAttribute("maxlength", "120");
    expect(screen.getByLabelText(/phone/i)).toHaveAttribute("maxlength", "32");
  });

  it("seeds the fields from the session rather than leaving them blank", () => {
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    expect(screen.getByLabelText(/your name/i)).toHaveValue("Nguyen Person");
    expect(screen.getByLabelText(/job title/i)).toHaveValue("Owner");
  });

  it("sends only the fields that changed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: meBody }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.clear(screen.getByLabelText(/job title/i));
    await userEvent.type(screen.getByLabelText(/job title/i), "Warehouse lead");
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // An untouched field must be absent, not sent as its current value.
    expect(Object.keys(lastBody(fetchMock))).toEqual(["job_title"]);
  });

  it("sends an explicit null for a field the seller cleared", async () => {
    // The distinction between omitted and null is what makes clearing a bio
    // possible at all.
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: meBody }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.clear(screen.getByLabelText(/bio/i));
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(lastBody(fetchMock)).toEqual({ bio: null });
  });

  it("shows a persisted success state instead of a silent write", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { data: meBody })));
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.clear(screen.getByLabelText(/job title/i));
    await userEvent.type(screen.getByLabelText(/job title/i), "Warehouse lead");
    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/profile saved/i);
  });

  it("does not send a request when nothing changed", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an oversized avatar before making a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    const bigFile = new File([new Uint8Array(2_097_153)], "big.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText(/avatar image file/i), bigFile);

    expect(await screen.findByText(/larger than 2 MB/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a file whose type is not an accepted image", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    const pdf = new File([new Uint8Array(10)], "notes.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText(/avatar image file/i), pdf);

    expect(await screen.findByText(/png, jpeg, or webp/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a file at exactly the limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: meBody }));
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    const exact = new File([new Uint8Array(2_097_152)], "exact.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText(/avatar image file/i), exact);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText(/larger than 2 MB/i)).not.toBeInTheDocument();
  });

  it("offers no remove control when there is no avatar to remove", () => {
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    expect(screen.getByRole("button", { name: /remove avatar/i })).toBeDisabled();
  });

  it("says where a deactivated account can be restored, not just that it cannot", async () => {
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /deactivate account/i }));

    expect(screen.getByText(/no self-service way to restore it/i)).toBeInTheDocument();
    expect(screen.getByText(/every session on every device is signed out/i)).toBeInTheDocument();
  });

  it("requires the typed acknowledgment before deactivating", async () => {
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /deactivate account/i }));

    expect(screen.getByRole("button", { name: /confirm deactivation/i })).toBeDisabled();
  });

  it("enables confirmation once acknowledged, and still requires the password", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /deactivate account/i }));
    await userEvent.click(screen.getByLabelText(/i understand/i));
    await userEvent.click(screen.getByRole("button", { name: /confirm deactivation/i }));

    // The acknowledgment is not a substitute for the password.
    expect(await screen.findByText(/enter your password/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("abandons the deactivation without sending anything", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ProfileForm />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("button", { name: /deactivate account/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByRole("button", { name: /deactivate account/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders nothing rather than empty fields when there is no session", () => {
    renderWithProviders(<ProfileForm />, { session: null });

    expect(screen.queryByLabelText(/bio/i)).not.toBeInTheDocument();
  });
});
