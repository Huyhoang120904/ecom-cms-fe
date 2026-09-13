import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BackendStatusPanel from "features/dashboard/components/backend-status-panel";

import { jsonResponse, renderWithProviders, sessionFixture } from "../helpers";

describe("dashboard against the enveloped contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reads readiness from a 503 envelope as a state, not an error", async () => {
    // The contract publishes the same envelope for 200 and for the 503 used when a
    // dependency is down, so a 503 here is a successful read of a real state.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve(
          url.includes("/health/ready")
            ? jsonResponse(503, {
                data: {
                  status: "not_ready",
                  dependencies: { database: "unavailable", redis: "unavailable" },
                },
              })
            : jsonResponse(200, { data: { status: "ok", service: "ecom-be" } }),
        ),
      ),
    );
    renderWithProviders(<BackendStatusPanel />, { session: sessionFixture });

    expect(await screen.findByText(/not_ready/i)).toBeInTheDocument();
    // A 503 must not be reported as an unreachable API.
    expect(screen.queryByText(/did not respond/i)).not.toBeInTheDocument();
  });

  it("reads liveness from the envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve(
          url.includes("/health/live")
            ? jsonResponse(200, { data: { status: "ok", service: "ecom-be" } })
            : jsonResponse(200, {
                data: { status: "ok", dependencies: { database: "ok", redis: "ok" } },
              }),
        ),
      ),
    );
    renderWithProviders(<BackendStatusPanel />, { session: sessionFixture });

    expect(await screen.findByText(/reachable/i)).toBeInTheDocument();
    expect(screen.getByText("ecom-be")).toBeInTheDocument();
  });

  it("reports each dependency's state from the enveloped body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve(
          url.includes("/health/live")
            ? jsonResponse(200, { data: { status: "ok", service: "ecom-be" } })
            : jsonResponse(200, {
                data: { status: "ok", dependencies: { database: "ok", redis: "unavailable" } },
              }),
        ),
      ),
    );
    renderWithProviders(<BackendStatusPanel />, { session: sessionFixture });

    expect(await screen.findByText("unavailable")).toBeInTheDocument();
  });

  it("treats a non-enveloped body as a broken contract rather than rendering blanks", async () => {
    // A bare payload means an endpoint forgot its envelope. Rendering `undefined`
    // into the panel would hide a real contract break.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { status: "ok", service: "ecom-be" })),
    );
    renderWithProviders(<BackendStatusPanel />, { session: sessionFixture });

    expect(await screen.findByText(/did not respond/i)).toBeInTheDocument();
  });
});
