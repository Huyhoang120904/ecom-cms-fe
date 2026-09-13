import { describe, expect, it } from "vitest";

import { parseProductFilters } from "./schemas";
import { listParamsFromFilters } from "./mapping";

describe("parseProductFilters", () => {
  it("normalizes invalid or missing page values", () => {
    expect(parseProductFilters({ page: "0" })).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("keeps a valid page and clamps an out-of-range page size", () => {
    expect(parseProductFilters({ page: "3", pageSize: "10" })).toEqual({
      search: "",
      page: 3,
      pageSize: 10,
    });
    // A too-large page size is clamped rather than rejected, so a crafted URL
    // still renders a list instead of throwing during render.
    expect(parseProductFilters({ pageSize: "500" }).pageSize).toBe(100);
    expect(parseProductFilters({ pageSize: "0" }).pageSize).toBe(20);
  });
});

describe("listParamsFromFilters", () => {
  it("omits an empty search term from the query string", () => {
    expect(listParamsFromFilters({ search: "", page: 1, pageSize: 20 })).toBe(
      "page=1&pageSize=20",
    );
    expect(
      listParamsFromFilters({ search: "lamp", page: 2, pageSize: 20 }),
    ).toBe("page=2&pageSize=20&search=lamp");
  });
});
