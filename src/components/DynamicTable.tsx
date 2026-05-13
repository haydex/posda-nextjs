"use client";

import { ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type RowLike = Record<string, unknown>;

export type DynamicTableColumn<T extends RowLike> = {
  key: keyof T & string;
  label?: string;
  render?: (value: unknown, row: T) => ReactNode;
};

type DynamicTableProps<T extends RowLike> = {
  rows: T[];
  columns?: Array<DynamicTableColumn<T>>;
  emptyMessage?: string;
  showPagination?: boolean;
  scrollMode?: "none" | "content";
  maxVisibleRows?: number;
  defaultItemsPerPage?: number;
  itemsPerPageOptions?: number[];
  totalItems?: number;
  currentPage?: number;
  currentItemsPerPage?: number;
  paginateRows?: boolean;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  formatters?: Partial<
    Record<keyof T & string, (value: unknown, row: T) => ReactNode>
  >;
  excludeKeys?: Array<keyof T & string>;
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T, index: number) => string | number;
};

function toLabel(raw: string) {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function defaultFormat(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

export default function DynamicTable<T extends RowLike>({
  rows,
  columns,
  emptyMessage = "No rows.",
  showPagination = true,
  scrollMode = "none",
  maxVisibleRows,
  defaultItemsPerPage = 4,
  itemsPerPageOptions,
  totalItems,
  currentPage,
  currentItemsPerPage,
  paginateRows = true,
  onPageChange,
  onItemsPerPageChange,
  formatters,
  excludeKeys,
  onRowClick,
  getRowKey,
}: DynamicTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">{emptyMessage}</p>
    );
  }

  const blocked = new Set<string>(excludeKeys ?? []);
  const inferredColumns: Array<DynamicTableColumn<T>> = (
    Object.keys(rows[0]).filter((key) => !blocked.has(key)) as Array<
      keyof T & string
    >
  ).map((key) => ({ key }));
  const resolvedColumns: Array<DynamicTableColumn<T>> =
    columns ?? inferredColumns;

  const safeDefaultItemsPerPage =
    Number.isFinite(defaultItemsPerPage) && defaultItemsPerPage > 0
      ? Math.floor(defaultItemsPerPage)
      : 4;

  const pageSizeOptions = useMemo(() => {
    const source =
      itemsPerPageOptions && itemsPerPageOptions.length > 0
        ? itemsPerPageOptions
        : [4, 10, 25, 50, 100];

    const cleaned = source
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((value) => Math.floor(value));

    const uniqueSorted = [...new Set(cleaned)].sort((a, b) => a - b);
    if (!uniqueSorted.includes(safeDefaultItemsPerPage)) {
      uniqueSorted.push(safeDefaultItemsPerPage);
      uniqueSorted.sort((a, b) => a - b);
    }

    return uniqueSorted;
  }, [itemsPerPageOptions, safeDefaultItemsPerPage]);

  const [internalItemsPerPage, setInternalItemsPerPage] = useState<number>(
    safeDefaultItemsPerPage,
  );
  const [internalCurrentPage, setInternalCurrentPage] = useState<number>(1);

  const resolvedItemsPerPage = currentItemsPerPage ?? internalItemsPerPage;
  const resolvedCurrentPage = currentPage ?? internalCurrentPage;
  const resolvedTotalItems = totalItems ?? rows.length;
  const shouldPaginate = showPagination && paginateRows;
  const totalPages = Math.max(
    1,
    Math.ceil(resolvedTotalItems / resolvedItemsPerPage),
  );
  const currentPageSafe = Math.min(resolvedCurrentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * resolvedItemsPerPage;
  const endIndex = startIndex + resolvedItemsPerPage;
  const visibleRows = shouldPaginate ? rows.slice(startIndex, endIndex) : rows;

  const showingStart =
    visibleRows.length > 0 ? (showPagination ? startIndex + 1 : 1) : 0;
  const showingEnd = showPagination
    ? Math.min(startIndex + visibleRows.length, resolvedTotalItems)
    : visibleRows.length;
  const showingTotal = showPagination ? resolvedTotalItems : visibleRows.length;

  const hasScrollableRows =
    !showPagination &&
    scrollMode === "content" &&
    typeof maxVisibleRows === "number" &&
    Number.isFinite(maxVisibleRows) &&
    maxVisibleRows > 0;
  const tableViewportMaxHeight = hasScrollableRows
    ? `${Math.floor(maxVisibleRows) * 41}px`
    : undefined;

  function updatePage(nextPage: number) {
    const clampedPage = Math.max(1, Math.min(totalPages, nextPage));
    setInternalCurrentPage(clampedPage);
    onPageChange?.(clampedPage);
  }

  function updateItemsPerPage(nextItemsPerPage: number) {
    setInternalItemsPerPage(nextItemsPerPage);
    setInternalCurrentPage(1);
    onItemsPerPageChange?.(nextItemsPerPage);
    onPageChange?.(1);
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          Showing {showingStart}-{showingEnd} of {showingTotal}
        </p>

        {showPagination && (
          <label className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="whitespace-nowrap">Items per page</span>
            <select
              value={resolvedItemsPerPage}
              onChange={(event) => {
                const nextSize = Number(event.target.value);
                updateItemsPerPage(nextSize);
              }}
              className="select select-sm w-auto! min-w-20 shrink-0"
              style={{ background: "var(--background)" }}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {hasScrollableRows ? (
        <div
          className="overflow-auto"
          style={{ maxHeight: tableViewportMaxHeight }}
        >
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0">
              <tr className="bg-accent">
                {resolvedColumns.map((column) => (
                  <th key={column.key} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white">
                    {column.label ?? toLabel(column.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr
                  title={onRowClick ? "Click to view details" : undefined}
                  key={
                    getRowKey
                      ? getRowKey(row, startIndex + index)
                      : startIndex + index
                  }
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={
                    onRowClick
                      ? "table-row-clickable border-b border-black/5 dark:border-white/5"
                      : "table-row border-b border-black/5 dark:border-white/5"
                  }
                >
                  {resolvedColumns.map((column) => {
                    const rawValue = row[column.key];
                    const formatter =
                      column.render ?? formatters?.[column.key];

                    return (
                      <td key={column.key} className="px-2 py-2">
                        {formatter
                          ? formatter(rawValue, row)
                          : defaultFormat(rawValue)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-accent">
                {resolvedColumns.map((column) => (
                  <th key={column.key} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white">
                    {column.label ?? toLabel(column.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr
                  title={onRowClick ? "Click to view details" : undefined}
                  key={
                    getRowKey
                      ? getRowKey(row, startIndex + index)
                      : startIndex + index
                  }
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={
                    onRowClick
                      ? "table-row-clickable border-b border-black/5 dark:border-white/5"
                      : "table-row border-b border-black/5 dark:border-white/5"
                  }
                >
                  {resolvedColumns.map((column) => {
                    const rawValue = row[column.key];
                    const formatter = column.render ?? formatters?.[column.key];

                    return (
                      <td key={column.key} className="px-2 py-2">
                        {formatter
                          ? formatter(rawValue, row)
                          : defaultFormat(rawValue)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPagination && totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
          <p>
            Page {currentPageSafe} of {totalPages}
          </p>

          <div className="inline-flex items-center gap-2">
            <Button
              type="button"
              onClick={() => updatePage(currentPageSafe - 1)}
              disabled={currentPageSafe <= 1}
              variant="ghost"
              size="sm"
            >
              Previous
            </Button>
            <Button
              type="button"
              onClick={() => updatePage(currentPageSafe + 1)}
              disabled={currentPageSafe >= totalPages}
              variant="ghost"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
