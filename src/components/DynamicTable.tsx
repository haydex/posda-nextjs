import { ReactNode } from "react";

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
  const resolvedColumns: Array<DynamicTableColumn<T>> = columns ?? inferredColumns;

  return (
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
          {rows.map((row, index) => (
            <tr
              key={getRowKey ? getRowKey(row, index) : index}
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
  );
}
