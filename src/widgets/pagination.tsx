import { Button } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-feather";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  itemLabel?: string;
}

/**
 * The shared pager.
 *
 * The range comes from the caller's own total (the server's `total` for the products
 * contract; the filtered sample count for orders), never from the rows currently rendered.
 * A stale page is clamped into range, and disabled directions stay visible so the control
 * does not move under the cursor between pages.
 */
export default function Pagination({
  page,
  pageSize,
  total,
  onPage,
  itemLabel = "items",
}: PaginationProps) {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(page, 1), pageCount);
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

      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
          Page {safePage} of {pageCount}
        </span>
        <div className="d-flex gap-2">
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
