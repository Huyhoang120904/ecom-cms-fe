import { z } from "zod";

/**
 * Validation schemas for the orders module.
 *
 * Listing state lives in the URL, so it is untrusted input: a malformed page
 * value is normalized to page 1 rather than rejected, because a broken link
 * should still render a working list shell.
 */

const normalizedPage = z.preprocess((value) => {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}, z.number().int().min(1));

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

// URL input is untrusted, so an out-of-range page size is clamped into the
// supported range instead of throwing during render.
const normalizedPageSize = z.preprocess((value) => {
  const pageSize = Number(value);
  if (!Number.isInteger(pageSize) || pageSize < 1) return PAGE_SIZE_DEFAULT;
  return Math.min(pageSize, PAGE_SIZE_MAX);
}, z.number().int().min(1).max(PAGE_SIZE_MAX));

export const orderFilterSchema = z.object({
  search: z.string().trim().default(""),
  page: normalizedPage,
  pageSize: normalizedPageSize,
});

export type OrderFilters = z.infer<typeof orderFilterSchema>;

/** Normalize an untrusted query object into a valid order filter. */
export function parseOrderFilters(
  query: Record<string, string | string[] | undefined> = {},
): OrderFilters {
  const search = query.search;

  return orderFilterSchema.parse({
    search: typeof search === "string" ? search : "",
    page: query.page,
    pageSize: query.pageSize,
  });
}
