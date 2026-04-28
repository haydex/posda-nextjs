"use client";

import { ReactNode, useMemo, useState } from "react";

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
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{emptyMessage}</p>
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
  const totalPages = Math.max(
    1,
    Math.ceil(resolvedTotalItems / resolvedItemsPerPage),
  );
  const currentPageSafe = Math.min(resolvedCurrentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * resolvedItemsPerPage;
  const endIndex = startIndex + resolvedItemsPerPage;
  const visibleRows = paginateRows ? rows.slice(startIndex, endIndex) : rows;

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
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          Showing {startIndex + 1}-{Math.min(endIndex, resolvedTotalItems)} of{" "}
          {resolvedTotalItems}
        </p>

        <label className="inline-flex items-center gap-2">
          <span>Items per page</span>
          <select
            value={resolvedItemsPerPage}
            onChange={(event) => {
              const nextSize = Number(event.target.value);
              updateItemsPerPage(nextSize);
            }}
            className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/15">
              {resolvedColumns.map((column) => (
                <th key={column.key} className="px-2 py-2 font-medium">
                  {column.label ?? toLabel(column.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr
                key={
                  getRowKey
                    ? getRowKey(row, startIndex + index)
                    : startIndex + index
                }
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick
                    ? "cursor-pointer border-b border-black/5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                    : "border-b border-black/5 dark:border-white/10"
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

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-300">
        <p>
          Page {currentPageSafe} of {totalPages}
        </p>

        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => updatePage(currentPageSafe - 1)}
            disabled={currentPageSafe <= 1}
            className="rounded-md border border-black/15 px-3 py-1.5 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => updatePage(currentPageSafe + 1)}
            disabled={currentPageSafe >= totalPages}
            className="rounded-md border border-black/15 px-3 py-1.5 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
