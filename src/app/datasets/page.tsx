"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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
  const [searchInput, setSearchInput] = useState("");
  const [activeOnlyInput, setActiveOnlyInput] = useState(false);
  const [typeInput, setTypeInput] = useState<
    "" | "collection" | "analysis_result"
  >("");

  const [filters, setFilters] = useState<{
    search: string;
    activeOnly: boolean;
    type: "" | "collection" | "analysis_result";
  }>({
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
    setFilters({
      search: searchInput,
      activeOnly: activeOnlyInput,
      type: typeInput,
    });
  }

  function clearFilters() {
    setSearchInput("");
    setActiveOnlyInput(false);
    setTypeInput("");
    setFilters({ search: "", activeOnly: false, type: "" });
  }

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
              placeholder="DOI, title, or name"
              className="h-10 w-full rounded-md border border-black/15 bg-transparent px-3 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20"
            />
          </label>

          <label className="text-sm">
            <span className="sr-only">Type</span>
            <select
              value={typeInput}
              onChange={(event) =>
                setTypeInput(
                  event.target.value as "" | "collection" | "analysis_result",
                )
              }
              className="h-10 w-full rounded-md border border-black/15 bg-white px-3 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="">All</option>
              <option value="collection">collection</option>
              <option value="analysis_result">analysis_result</option>
            </select>
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
              Total datasets: <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">ID</th>
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">DOI</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datasets.map((dataset) => (
                    <tr
                      key={dataset.dataset_id}
                      onClick={() =>
                        router.push(`/datasets/${dataset.dataset_id}`)
                      }
                      className="cursor-pointer border-b border-black/5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                    >
                      <td className="px-2 py-2">{dataset.dataset_id}</td>
                      <td className="px-2 py-2">{dataset.dataset_name}</td>
                      <td className="px-2 py-2">{dataset.dataset_doi}</td>
                      <td className="px-2 py-2">{dataset.dataset_type}</td>
                      <td className="px-2 py-2">
                        {dataset.active ? "Yes" : "No"}
                      </td>
                      <td className="px-2 py-2">
                        {new Date(dataset.when_created).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">
                        {new Date(dataset.when_updated).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
