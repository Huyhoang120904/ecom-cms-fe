import type { ReactNode } from "react";
import { Table } from "react-bootstrap";

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
  render: (row: Row) => ReactNode;
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
}: DataTableProps<Row>) {
  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  const head = (
    <thead className="table-light">
      <tr>
        {columns.map((column) => (
          <th
            key={column.id}
            scope="col"
            style={column.width ? { width: column.width } : undefined}
            className={headerCellClass(column)}
          >
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );

  if (isLoading) {
    return (
      <Table responsive className="align-middle mb-0 text-nowrap">
        {caption ? <caption className="px-4 text-muted small">{caption}</caption> : null}
        {head}
        <tbody>
          {Array.from({ length: loadingRows }, (_, index) => (
            <tr key={index} aria-hidden="true">
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

  return (
    <Table responsive className="align-middle mb-0 text-nowrap">
      {caption ? <caption className="px-4 text-muted small">{caption}</caption> : null}
      {head}
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)}>
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
