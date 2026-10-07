import { describe, expect, it } from "vitest";

import { listParamsFromFilters } from "./mapping";
import { parseProductFilters } from "./schemas";

describe("parseProductFilters", () => {
  it("normalizes invalid or missing page values", () => {
    expect(parseProductFilters({ page: "0" })).toEqual({
      status: undefined,
      page: 1,
      pageSize: 20,
    });
  });

  it("keeps a valid page and clamps an out-of-range page size", () => {
    expect(parseProductFilters({ page: "3", pageSize: "10" })).toEqual({
      status: undefined,
      page: 3,
      pageSize: 10,
    });
    // A too-large page size is clamped rather than rejected, so a crafted URL still
    // renders a list instead of throwing during render.
    expect(parseProductFilters({ pageSize: "500" }).pageSize).toBe(100);
    expect(parseProductFilters({ pageSize: "0" }).pageSize).toBe(20);
  });

  it("accepts only the contract's own statuses", () => {
    expect(parseProductFilters({ status: "active" }).status).toBe("active");
    expect(parseProductFilters({ status: "draft" }).status).toBe("draft");
    expect(parseProductFilters({ status: "inactive" }).status).toBe("inactive");
    // The backend's list endpoint filters by status only: an unknown value, or the
    // `all` the UI uses for "no filter", must not become a 422.
    expect(parseProductFilters({ status: "archived" }).status).toBeUndefined();
    expect(parseProductFilters({ status: "all" }).status).toBeUndefined();
  });
});

describe("listParamsFromFilters", () => {
  it("sends the contract's own page, page_size, and status parameters", () => {
    expect(listParamsFromFilters({ status: undefined, page: 1, pageSize: 20 })).toBe(
      "page=1&page_size=20",
    );
    expect(listParamsFromFilters({ status: "active", page: 2, pageSize: 50 })).toBe(
      "page=2&page_size=50&status=active",
    );
  });
});

