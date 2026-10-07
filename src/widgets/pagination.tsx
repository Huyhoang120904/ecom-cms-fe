import { Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-feather";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  itemLabel?: string;
  /** Honest page-size options; the select renders only with `onPageSizeChange`. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

/**
 * The shared pager.
 *
 * The range comes from the caller's own total (the server's `total` for the products
 * contract; the filtered sample count for orders), never from the rows currently rendered.
 * A stale page is clamped into range, and disabled directions stay visible so the control
 * does not move under the cursor between pages.
 */
/** Page buttons with an ellipsis for long ranges. Never invents a page. */
function pageNumbers(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const window = [page - 1, page, page + 1].filter((n) => n > 1 && n < pageCount);
  const unique = [...new Set([1, ...window, pageCount])].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (const [index, value] of unique.entries()) {
    if (index > 0 && value - unique[index - 1]! > 1) out.push("…");
    out.push(value);
  }
  return out;
}
export default function Pagination({
  page,
  pageSize,
  total,
  onPage,
  itemLabel = "items",
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const numbers = pageNumbers(safePage, pageCount);
  const first = total === 0 ? 0 : (safePage - 1) * size + 1;
  const last = Math.min(safePage * size, total);

  return (
    <nav
      aria-label="Pagination"
      className="d-flex flex-wrap justify-content-between align-items-center gap-3 px-4 py-3 border-top"
    >
      <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
        Showing {first}–{last} of {total} {itemLabel}
      </span>

      <div className="d-flex flex-wrap align-items-center gap-3">
        <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
          Page {safePage} of {pageCount}
        </span>
        {onPageSizeChange && pageSizeOptions ? (
          <label className="pager-perpage text-muted small">
            Rows per page{" "}
            <select
              className="form-select form-select-sm d-inline-block w-auto"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="d-flex flex-wrap align-items-center gap-1">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={safePage <= 1}
            onClick={() => onPage(safePage - 1)}
          >
            <ChevronLeft size={14} className="me-1" aria-hidden="true" />
            Previous
          </Button>
          {numbers.map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="text-muted small px-1" aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === safePage ? "primary" : "outline-secondary"}
                size="sm"
                disabled={item === safePage}
                aria-label={`Go to page ${item}`}
                aria-current={item === safePage ? "page" : undefined}
                onClick={() => onPage(item)}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center"
            disabled={safePage >= pageCount}
            onClick={() => onPage(safePage + 1)}
          >
            Next
            <ChevronRight size={14} className="ms-1" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
