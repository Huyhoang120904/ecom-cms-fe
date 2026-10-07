import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrdersPage from "features/orders/components/orders-page";
import { OrderStatusBadge } from "features/orders/components/orders-table";
import ProductsPage from "features/products/components/products-page";
import { ProductStatusBadge } from "features/products/components/products-table";

import { jsonResponse, renderWithProviders, sessionFixture } from "../helpers";
import { publishProduct, unpublishProduct } from "features/products/api";

vi.mock("features/products/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("features/products/api")>()),
  publishProduct: vi.fn(),
  unpublishProduct: vi.fn(),
}));

const PRODUCT_ID = "33333333-3333-4333-8333-333333333333";
const CATEGORY_ID = "44444444-4444-4444-8444-444444444444";

/** One list row, exactly as `ProductSummary` describes it. */
const SUMMARY = {
  id: PRODUCT_ID,
  category_id: CATEGORY_ID,
  brand_id: null,
  name: "Cloudline Pendant",
  status: "draft" as const,
  created_at: "2026-09-20T03:00:00Z",
  updated_at: "2026-09-22T03:00:00Z",
};

const CATEGORY_TREE = [
  {
    id: CATEGORY_ID,
    name: "Lighting",
    slug: "lighting",
    position: 0,
    is_leaf: true,
    children: [],
  },
];

const EMPTY_PAGE = { items: [], total: 0, page: 1, page_size: 20 };
const ONE_PAGE = { items: [SUMMARY], total: 1, page: 1, page_size: 20 };
const SECOND_ID = "55555555-5555-4555-8555-555555555555";
const SECOND_SUMMARY = {
  ...SUMMARY,
  id: SECOND_ID,
  name: "Second Lamp",
  status: "active" as const,
};
const TWO_PAGE = { items: [SUMMARY, SECOND_SUMMARY], total: 2, page: 1, page_size: 20 };
const writerSession = {
  ...sessionFixture,
  permissions: [...sessionFixture.permissions, "products:write"],
};

/**
 * Stub the three reads the list page performs: the page itself, plus the category tree and
 * brand list it resolves names from. Any other request fails the test loudly instead of
 * quietly looking like an empty body.
 */
function stubList(body: unknown, status = 200, failFromListCall = Number.POSITIVE_INFINITY) {
  let listCalls = 0;
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/products?")) {
      listCalls += 1;
      if (listCalls >= failFromListCall) {
        return jsonResponse(403, { error: "forbidden", message: "Not allowed" });
      }
      return jsonResponse(status, body);
    }
    if (url.includes("/api/v1/catalog/categories")) {
      return jsonResponse(200, { status_code: 200, message: "Success", data: CATEGORY_TREE });
    }
    if (url.includes("/api/v1/catalog/brands")) {
      return jsonResponse(200, { status_code: 200, message: "Success", data: [] });
    }
    throw new Error(`unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The URL of the product list request, which is what the contract's parameters live on. */
function listUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  const call = fetchMock.mock.calls.find(([input]) =>
    String(input).includes("/api/v1/products?"),
  );
  return call ? String(call[0]) : "";
}

describe("product and order status badges", () => {
  it("renders the three product statuses the contract defines", () => {
    const { rerender } = render(<ProductStatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();

    rerender(<ProductStatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<ProductStatusBadge status="inactive" />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("keeps the order badges unchanged", () => {
    const { rerender } = render(<OrderStatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();

    rerender(<OrderStatusBadge status="processing" />);
    expect(screen.getByText("Processing")).toBeInTheDocument();

    rerender(<OrderStatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});

describe("products page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // The tabs read their checked state from the URL: a `status` left over from a
    // previous case would leave "Active" already checked, so its click fires no change
    // and the next case sees no navigation. Reset to an empty query string instead.
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as never);
    vi.mocked(useRouter).mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);
    vi.mocked(publishProduct).mockReset();
    vi.mocked(unpublishProduct).mockReset();
  });

  it("renders a row per product and links it to its detail page", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });

    renderWithProviders(<ProductsPage />, { session: sessionFixture });

    expect(await screen.findByText("Cloudline Pendant")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Cloudline Pendant" })).toHaveAttribute(
      "href",
      `/products/${PRODUCT_ID}`,
    );
    // The category name is resolved from the catalog rather than shown as a raw id.
    expect(screen.getByText("Lighting")).toBeInTheDocument();
  });

  it("asks for exactly the parameters the endpoint supports", async () => {
    const fetchMock = stubList({ status_code: 200, message: "Success", data: ONE_PAGE });

    renderWithProviders(<ProductsPage />, { session: sessionFixture });
    await screen.findByText("Cloudline Pendant");

    const url = listUrl(fetchMock);
    expect(url).toContain("page=1");
    expect(url).toContain("page_size=20");
    // The endpoint has no search parameter, so the page must not pretend it has one.
    expect(url).not.toContain("search");
    expect(url).not.toContain("status=");
  });

  it("reads the status filter out of the URL, which is the only filter the endpoint has", async () => {
    const fetchMock = stubList({ status_code: 200, message: "Success", data: EMPTY_PAGE });
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("status=active&page=2") as never,
    );

    renderWithProviders(<ProductsPage />, { session: sessionFixture });

    await waitFor(() => expect(listUrl(fetchMock)).toContain("page=2"));
    expect(listUrl(fetchMock)).toContain("status=active");
    expect(listUrl(fetchMock)).not.toContain("search");
    expect(await screen.findByRole("radio", { name: "Active" })).toBeChecked();
  });

  it("writes a status change back into the URL rather than keeping it in memory", async () => {
    stubList({ status_code: 200, message: "Success", data: EMPTY_PAGE });
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<ProductsPage />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("radio", { name: "Active" }));

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("status=active");
  });

  it("shows an honest empty state when the shop has no products", async () => {
    stubList({ status_code: 200, message: "Success", data: EMPTY_PAGE });

    renderWithProviders(<ProductsPage />, { session: sessionFixture });

    expect(await screen.findByText(/no products yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("surfaces the backend's own error instead of rows", async () => {
    stubList({ error: "forbidden", message: "Not allowed" }, 403);

    renderWithProviders(<ProductsPage />, { session: sessionFixture });

    expect(await screen.findByRole("alert")).toHaveTextContent("Not allowed");
    expect(screen.queryByText("Cloudline Pendant")).not.toBeInTheDocument();
  });

  it("shows the contract's own total in the shared pager", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });

    renderWithProviders(<ProductsPage />, { session: sessionFixture });
    await screen.findByText("Cloudline Pendant");

    expect(screen.getByText(/showing 1–1 of 1 products/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("drops the cached rows and pager when a refetch fails", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE }, 200, 2);

    const { queryClient } = renderWithProviders(<ProductsPage />, { session: sessionFixture });
    await screen.findByText("Cloudline Pendant");
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();

    await act(async () => {
      await queryClient.invalidateQueries();
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Not allowed");
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    expect(screen.queryByText("Cloudline Pendant")).not.toBeInTheDocument();
  });

  it("publishes the selected rows and clears the selection", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });
    vi.mocked(publishProduct).mockResolvedValue({ id: PRODUCT_ID } as never);
    const user = userEvent.setup();

    renderWithProviders(<ProductsPage />, { session: writerSession });
    await screen.findByText("Cloudline Pendant");

    await user.click(screen.getByRole("checkbox", { name: /select row/i }));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(publishProduct).toHaveBeenCalledWith(PRODUCT_ID));
    await waitFor(() =>
      expect(screen.queryByText(/1 product selected/i)).not.toBeInTheDocument(),
    );
  });

  it("names the rows a bulk run fails on and retries only them", async () => {
    stubList({ status_code: 200, message: "Success", data: TWO_PAGE });
    vi.mocked(publishProduct).mockImplementation((id: string) =>
      id === PRODUCT_ID
        ? Promise.resolve({ id } as never)
        : Promise.reject(new Error("No active variant")),
    );
    const user = userEvent.setup();

    renderWithProviders(<ProductsPage />, { session: writerSession });
    await screen.findByText("Cloudline Pendant");

    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await screen.findByText(/published 1 of 2/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/second lamp/i);

    await user.click(screen.getByRole("button", { name: /retry failed/i }));
    await waitFor(() => expect(vi.mocked(publishProduct)).toHaveBeenCalledTimes(3));
    expect(vi.mocked(publishProduct).mock.calls.at(-1)?.[0]).toBe(SECOND_ID);
  });

  it("writes a page-size change back into the URL and resets to page one", async () => {
    stubList({ status_code: 200, message: "Success", data: ONE_PAGE });
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<ProductsPage />, { session: sessionFixture });
    await screen.findByText("Cloudline Pendant");

    await userEvent.selectOptions(screen.getByLabelText(/rows per page/i), "50");

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("pageSize=50");
    expect(url).toContain("page=1");
  });
});

describe("orders page", () => {
  beforeEach(() => {
    // The products cases stub `fetch` and override the navigation hooks; the orders page
    // paginates its own sample rows from those same hooks, so both have to be reset or it
    // inherits a page number with no rows on it.
    vi.unstubAllGlobals();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as never);
    vi.mocked(useRouter).mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);
  });

  it("renders the Orders page structure with heading and stat cards", () => {
    renderWithProviders(<OrdersPage />, { session: sessionFixture });
    expect(screen.getByRole("heading", { name: /orders/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export orders/i })).toBeInTheDocument();
    expect(screen.getByText(/total orders/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/order reference/i)).toBeInTheDocument();
  });

  it("opens a compact order detail drawer from a sample row", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    await user.click(screen.getByRole("button", { name: /view order ord-2048/i }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("ORD-2048");
    expect(screen.getAllByText("Linh Tran").length).toBeGreaterThan(1);
    expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
  });

  it("writes a status tab change back into the URL", async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    await userEvent.click(screen.getByRole("radio", { name: "Completed" }));

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("status=completed");
  });

  it("removes the search chip and clears the query", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("search=ord") as never);
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    expect(
      screen.getByRole("button", { name: "Remove Search filter: ord" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remove Search filter: ord" }));

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).not.toContain("search");
  });

  it("toggles the sort direction on a sortable column", async () => {
    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    const total = screen.getByRole("columnheader", { name: /total/i });
    expect(total).toHaveAttribute("aria-sort", "none");

    await userEvent.click(screen.getByRole("button", { name: "Sort by Total" }));
    expect(screen.getByRole("columnheader", { name: /total/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await userEvent.click(screen.getByRole("button", { name: "Sort by Total" }));
    expect(screen.getByRole("columnheader", { name: /total/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("writes a page-size change back into the URL and resets to page one", async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      refresh: vi.fn(),
      forward: vi.fn(),
    } as never);

    renderWithProviders(<OrdersPage />, { session: sessionFixture });

    await userEvent.selectOptions(screen.getByLabelText(/rows per page/i), "10");

    expect(replace).toHaveBeenCalled();
    const [url] = replace.mock.calls.at(-1) as [string];
    expect(url).toContain("pageSize=10");
    expect(url).toContain("page=1");
  });
});