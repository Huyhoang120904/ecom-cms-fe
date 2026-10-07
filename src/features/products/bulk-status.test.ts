import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publishProduct, unpublishProduct } from "features/products/api";
import { useBulkProductStatusMutation } from "features/products/mutations";
import { productsKeys } from "features/products/queries";

vi.mock("features/products/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("features/products/api")>()),
  publishProduct: vi.fn(),
  unpublishProduct: vi.fn(),
}));

function harness() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, invalidate, wrapper };
}

describe("bulk product status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("publishes every id and reports per-id results", async () => {
    const { invalidate, wrapper } = harness();
    vi.mocked(publishProduct).mockResolvedValue({ id: "a" } as never);

    const { result } = renderHook(() => useBulkProductStatusMutation(), { wrapper });
    const results = await result.current.mutateAsync({ ids: ["a", "b"], action: "publish" });

    expect(results).toEqual([
      { id: "a", ok: true },
      { id: "b", ok: true },
    ]);
    expect(publishProduct).toHaveBeenCalledTimes(2);
    expect(publishProduct).toHaveBeenNthCalledWith(1, "a");
    expect(publishProduct).toHaveBeenNthCalledWith(2, "b");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.all });
  });

  it("collects failures with the backend message instead of throwing", async () => {
    const { wrapper } = harness();
    vi.mocked(publishProduct)
      .mockResolvedValueOnce({ id: "a" } as never)
      .mockRejectedValueOnce(new Error("No active variant"));

    const { result } = renderHook(() => useBulkProductStatusMutation(), { wrapper });
    const results = await result.current.mutateAsync({ ids: ["a", "b"], action: "publish" });

    expect(results).toEqual([
      { id: "a", ok: true },
      { id: "b", ok: false, message: "No active variant" },
    ]);
  });

  it("unpublishes through the unpublish endpoint", async () => {
    const { wrapper } = harness();
    vi.mocked(unpublishProduct).mockResolvedValue({ id: "a" } as never);

    const { result } = renderHook(() => useBulkProductStatusMutation(), { wrapper });
    const results = await result.current.mutateAsync({ ids: ["a"], action: "unpublish" });

    expect(results).toEqual([{ id: "a", ok: true }]);
    expect(unpublishProduct).toHaveBeenCalledWith("a");
    expect(publishProduct).not.toHaveBeenCalled();
  });
});
