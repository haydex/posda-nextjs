"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Table from "@/components/Table";

type Recordset = {
  recordset_id: number;
  recordset_doi: string | null;
  dataset_id: number;
  license_id: number;
  license_label?: string;
  license_url?: string;
  is_public_access?: boolean;
  recordset_type: string;
  recordset_title: string;
  recordset_name?: string;
  active: boolean;
  when_created?: string;
  who_created?: string;
  when_updated?: string;
  who_updated?: string;
};

type RecordsetsResponse = {
  recordsets: Recordset[];
  total: number;
  timestamp: string;
};

function normalizeRecordsetsResponse(payload: unknown): RecordsetsResponse {
  const source = payload as
    | {
        recordsets?: Recordset[];
        total?: number;
        timestamp?: string;
        data?: Recordset[];
        meta?: { count?: number };
      }
    | undefined;

  const recordsets = Array.isArray(source?.recordsets)
    ? source.recordsets
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    recordsets,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : recordsets.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return "-";
  }

  return new Date(time).toLocaleString();
}

export default function RecordsetsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [activeOnlyInput, setActiveOnlyInput] = useState(false);
  const [datasetIdInput, setDatasetIdInput] = useState("");

  const [filters, setFilters] = useState<{
    search: string;
    activeOnly: boolean;
    datasetId: string;
  }>({
    search: "",
    activeOnly: false,
    datasetId: "",
  });

  const [data, setData] = useState<RecordsetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRecordsets() {
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

      if (filters.datasetId.trim()) {
        apiParams.set("dataset_id", filters.datasetId.trim());
      }

      const apiUrl =
        apiParams.size > 0
          ? `/api/recordsets?${apiParams.toString()}`
          : "/api/recordsets";

      const response = await fetch(apiUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as unknown;
      const normalized = normalizeRecordsetsResponse(json);
      setData(normalized);
    } catch {
      setError("Could not load recordsets.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      search: searchInput,
      activeOnly: activeOnlyInput,
      datasetId: datasetIdInput,
    });
  }

  function clearFilters() {
    setSearchInput("");
    setActiveOnlyInput(false);
    setDatasetIdInput("");
    setFilters({ search: "", activeOnly: false, datasetId: "" });
  }

  useEffect(() => {
    void loadRecordsets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="border-b-2 border-black pb-2 text-3xl font-semibold tracking-tight dark:border-white">
        Recordsets
      </h1>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <form
          onSubmit={applyFilters}
          className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto_auto_auto] md:items-center"
        >
          <label className="text-sm">
            <span className="sr-only">Search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="DOI, title, or type"
              className="h-10 w-full rounded-md border border-black/15 bg-transparent px-3 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20"
            />
          </label>

          <label className="text-sm">
            <span className="sr-only">Dataset ID</span>
            <input
              type="text"
              value={datasetIdInput}
              onChange={(event) => setDatasetIdInput(event.target.value)}
              placeholder="dataset_id"
              inputMode="numeric"
              className="h-10 w-full rounded-md border border-black/15 bg-transparent px-3 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20"
            />
          </label>

          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnlyInput}
              onChange={(event) => setActiveOnlyInput(event.target.checked)}
              className="h-4 w-4"
            />
            <span>active_only</span>
          </label>

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
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total recordsets:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            <Table
              rows={data.recordsets}
              columns={[
                { key: "recordset_id", label: "ID" },
                { key: "recordset_doi", label: "DOI" },
                { key: "dataset_id", label: "Dataset ID" },
                { key: "license_label", label: "License" },
                { key: "recordset_type", label: "Type" },
                { key: "recordset_title", label: "Title" },
                { key: "active", label: "Active" },
                { key: "when_created", label: "When Created" },
                { key: "when_updated", label: "When Updated" },
              ]}
              formatters={{
                when_created: (value) => formatDateTime(value as string),
                when_updated: (value) => formatDateTime(value as string),
              }}
              onRowClick={(row) =>
                router.push(`/recordsets/${row.recordset_id}`)
              }
              getRowKey={(row) => row.recordset_id}
            />

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click a recordset row to open details.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadRecordsets()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
