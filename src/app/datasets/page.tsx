"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";
import DynamicTable from "@/components/DynamicTable";

type Dataset = {
  dataset_id: number;
  dataset_doi: string;
  dataset_type: string;
  dataset_short_title: string;
  dataset_title: string;
  dataset_name: string;
  active: boolean;
  when_created: string;
  when_updated: string;
};

type DatasetsResponse = {
  datasets: Dataset[];
  total: number;
  timestamp: string;
};

type DatasetFilters = {
  search: string;
  activeOnly: boolean;
  type: "" | "collection" | "analysis_result";
};

function normalizeDatasetsResponse(payload: unknown): DatasetsResponse {
  const source = payload as
    | {
        datasets?: Dataset[];
        total?: number;
        timestamp?: string;
        data?: Dataset[];
        meta?: { count?: number };
      }
    | undefined;

  const datasets = Array.isArray(source?.datasets)
    ? source.datasets
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    datasets,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : datasets.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

export default function DatasetsPage() {
  const router = useRouter();
  const [filtersInput, setFiltersInput] = useState<DatasetFilters>({
    search: "",
    activeOnly: false,
    type: "",
  });

  const [filters, setFilters] = useState<DatasetFilters>({
    search: "",
    activeOnly: false,
    type: "",
  });

  const [data, setData] = useState<DatasetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDatasets() {
    setIsLoading(true);
    setError(null);

    try {
      const apiParams = new URLSearchParams();

      if (filters.search.trim()) {
        apiParams.set("search", filters.search.trim());
      }

      if (filters.activeOnly) {
        apiParams.set("active_only", "true");
      }

      if (filters.type) {
        apiParams.set("type", filters.type);
      }

      const query = apiParams.toString();
      const endpoint = query ? `/api/datasets?${query}` : "/api/datasets";

      const response = await fetch(endpoint, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as unknown;
      const normalized = normalizeDatasetsResponse(json);
      setData(normalized);
    } catch {
      setError("Could not load datasets.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(filtersInput);
  }

  function clearFilters() {
    setFiltersInput({ search: "", activeOnly: false, type: "" });
    setFilters({ search: "", activeOnly: false, type: "" });
  }

  const filterFields: Array<DynamicFormField<DatasetFilters>> = [
    {
      key: "search",
      label: "Search",
      placeholder: "DOI, title, or name",
      srOnlyLabel: true,
      className: "text-sm",
      controlClassName:
        "h-10 w-full rounded-md border border-black/15 bg-transparent px-3 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20",
    },
    {
      key: "type",
      label: "Type",
      type: "select",
      srOnlyLabel: true,
      options: [
        { value: "", label: "All" },
        { value: "collection" },
        { value: "analysis_result" },
      ],
      className: "text-sm",
      controlClassName:
        "h-10 w-full rounded-md border border-black/15 bg-white px-3 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
    },
    {
      key: "activeOnly",
      label: "active_only",
      type: "checkbox",
      className: "flex h-10 items-center gap-2 text-sm",
      controlClassName: "h-4 w-4",
    },
  ];

  useEffect(() => {
    void loadDatasets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="border-b-2 border-black pb-2 text-3xl font-semibold tracking-tight dark:border-white">
        Datasets
      </h1>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <DynamicForm
          onSubmit={applyFilters}
          values={filtersInput}
          onChange={setFiltersInput}
          fields={filterFields}
          className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto_auto_auto] md:items-center"
          actions={
            <>
              <button
                type="submit"
                className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-md border border-black/15 px-4 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Clear
              </button>
            </>
          }
        />
      </section>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total datasets: <span className="font-medium">{data.total}</span>
            </p>

            <DynamicTable
              rows={data.datasets}
              defaultItemsPerPage={6}
              columns={[
                { key: "dataset_id", label: "ID" },
                { key: "dataset_name", label: "Name" },
                { key: "dataset_doi", label: "DOI" },
                { key: "dataset_type", label: "Type" },
                { key: "active", label: "Active" },
                { key: "when_created", label: "Created" },
                { key: "when_updated", label: "Updated" },
              ]}
              formatters={{
                when_created: (value) =>
                  new Date(String(value)).toLocaleString(),
                when_updated: (value) =>
                  new Date(String(value)).toLocaleString(),
              }}
              onRowClick={(row) => router.push(`/datasets/${row.dataset_id}`)}
              getRowKey={(row) => row.dataset_id}
            />

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click a dataset row to open details.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadDatasets()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
