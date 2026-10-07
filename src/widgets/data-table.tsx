import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Table } from "react-bootstrap";
import { ChevronDown, ChevronUp, ChevronsDown } from "react-feather";

import ErrorState from "widgets/error-state";

export interface DataTableColumn<Row> {
  id: string;
  /** A header cell; put sort buttons here so sorting stays feature-owned. */
  header: ReactNode;
  width?: string;
  align?: "start" | "end";
  className?: string;
  /** Skeleton bar width in px for this column while loading. */
  skeletonWidth?: number;
  /** Opt-in header sort button. The feature owns the sort state and the row order. */
  sortable?: boolean;
  /** Key reported to `onSortChange`. Defaults to the column id. */
  sortKey?: string;
  /** Accessible label for the sort button. Defaults to the header when it is a string. */
  sortLabel?: string;
  render: (row: Row) => ReactNode;
  /**
   * Card-mode mapping under 768px. A column without `mobile` is skipped on
   * cards; `hide` skips it explicitly; a mapping without `label` renders the
   * value full-width with no label row (used for the actions column).
   */
  mobile?: { label?: string; hide?: boolean };
}

export type SortDirection = "asc" | "desc";

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  caption?: string;
  emptyState?: ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
  isLoading?: boolean;
  loadingRows?: number;
  sort?: DataTableSort;
  onSortChange?: (key: string) => void;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Accessible row name for the row checkbox. Defaults to the row key. */
  getRowLabel?: (row: Row) => string;
  /** `"auto"` follows a 768px media query; explicit values exist so tests can force either rendering. */
  layout?: "auto" | "table" | "cards";
}

function cellClass<Row>(column: DataTableColumn<Row>): string {
  const parts: string[] = [];
  if (column.align === "end") parts.push("text-end", "pe-4");
  if (column.className) parts.push(column.className);
  return parts.join(" ");
}

function headerCellClass<Row>(column: DataTableColumn<Row>): string {
  const parts: string[] = [];
  if (column.align === "end") parts.push("text-end", "pe-4");
  if (column.className) parts.push(column.className);
  return parts.join(" ");
}

const MOBILE_QUERY = "(max-width: 767.98px)";

/** Viewport match without a hooks directory: this is the only consumer. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia !== "undefined"
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/**
 * The shared table for listing surfaces.
 *
 * Order of precedence: error, loading, empty, ready. The empty state renders without a
 * table element so "no rows were invented" stays testable; skeleton rows are hidden from
 * assistive tech so the loading state is not announced row by row.
 */
export default function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyState,
  errorMessage,
  onRetry,
  isLoading = false,
  loadingRows = 5,
  sort,
  onSortChange,
  selectedKeys,
  onSelectionChange,
  getRowLabel,
  layout = "auto",
}: DataTableProps<Row>) {
  const isMobileViewport = useMediaQuery(MOBILE_QUERY);
  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  const selectable = onSelectionChange !== undefined;
  const selected = new Set(selectedKeys ?? []);
  const labelOf = getRowLabel ?? getRowKey;
  const allVisible = rows.length > 0 && rows.every((row) => selected.has(getRowKey(row)));
  const someVisible = rows.some((row) => selected.has(getRowKey(row)));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allVisible) {
      const visible = new Set(rows.map((row) => getRowKey(row)));
      onSelectionChange((selectedKeys ?? []).filter((key) => !visible.has(key)));
    } else {
      const next = [...(selectedKeys ?? [])];
      for (const row of rows) {
        const key = getRowKey(row);
        if (!next.includes(key)) next.push(key);
      }
      onSelectionChange(next);
    }
  }

  function toggleOne(key: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selected.has(key)
        ? (selectedKeys ?? []).filter((current) => current !== key)
        : [...(selectedKeys ?? []), key],
    );
  }

  const cards = layout === "cards" || (layout === "auto" && isMobileViewport);

  const head = (
    <thead className="table-light">
      <tr>
          {selectable ? (
            <th scope="col" className="data-table-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={allVisible}
                ref={(node) => {
                  if (node) node.indeterminate = !allVisible && someVisible;
                }}
                aria-label="Select all rows"
                onChange={toggleAll}
              />
            </th>
          ) : null}
        {columns.map((column) => {
          const sortable = column.sortable === true && onSortChange !== undefined;
          const key = column.sortKey ?? column.id;
          const active = sortable && sort?.key === key;
          const label =
            column.sortLabel ?? (typeof column.header === "string" ? column.header : column.id);
          const Icon = !active ? ChevronsDown : sort?.direction === "asc" ? ChevronUp : ChevronDown;
          return (
            <th
              key={column.id}
              scope="col"
              style={column.width ? { width: column.width } : undefined}
              className={headerCellClass(column)}
              aria-sort={
                !sortable
                  ? undefined
                  : !active
                    ? "none"
                    : sort?.direction === "asc"
                      ? "ascending"
                      : "descending"
              }
            >
              {sortable && onSortChange ? (
                <button
                  type="button"
                  className="table-sort-btn"
                  aria-label={`Sort by ${label}`}
                  onClick={() => onSortChange(key)}
                >
                  <span>{column.header}</span>
                  <Icon size={14} aria-hidden="true" />
                </button>
              ) : (
                column.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );

  if (isLoading) {
    if (cards) {
      return (
        <div className="data-card-list">
          {Array.from({ length: loadingRows }, (_, index) => (
            <div key={index} aria-hidden="true" className="shopee-card data-card">
              <span className="shopee-skeleton" style={{ width: 140 }} />
              <span className="shopee-skeleton" style={{ width: 96 }} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <Table responsive className="data-table align-middle mb-0 text-nowrap">
        {caption ? <caption className="px-4 text-muted small">{caption}</caption> : null}
        {head}
        <tbody>
          {Array.from({ length: loadingRows }, (_, index) => (
            <tr key={index} aria-hidden="true">
              {selectable ? <td className="data-table-check" aria-hidden="true" /> : null}
              {columns.map((column) => (
                <td key={column.id} className={cellClass(column)}>
                  <span
                    className="shopee-skeleton"
                    style={{ width: column.skeletonWidth ?? 96 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  if (rows.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  if (cards) {
    return (
      <ul className="data-card-list">
        {rows.map((row) => {
          const key = getRowKey(row);
          return (
            <li key={key} className="shopee-card data-card" data-selected={selectable && selected.has(key) ? "true" : undefined}>
              {selectable ? (
                <div className="data-card-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.has(key)}
                    aria-label={`Select row ${labelOf(row)}`}
                    onChange={() => toggleOne(key)}
                  />
                </div>
              ) : null}
              {columns.map((column) => {
                if (!column.mobile || column.mobile.hide) return null;
                return (
                  <div key={column.id} className="data-card-field">
                    {column.mobile.label ? (
                      <span className="data-card-label">{column.mobile.label}</span>
                    ) : null}
                    <span className="data-card-value">{column.render(row)}</span>
                  </div>
                );
              })}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Table responsive className="data-table align-middle mb-0 text-nowrap">
      {caption ? <caption className="px-4 text-muted small">{caption}</caption> : null}
      {head}
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)} data-selected={selectable && selected.has(getRowKey(row)) ? "true" : undefined}>
            {selectable ? (
              <td className="data-table-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.has(getRowKey(row))}
                  aria-label={`Select row ${labelOf(row)}`}
                  onChange={() => toggleOne(getRowKey(row))}
                />
              </td>
            ) : null}
            {columns.map((column) => (
              <td key={column.id} className={cellClass(column)}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
