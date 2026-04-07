"use client";

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
  who_created: string;
  who_updated: string;
};

type DatasetsResponse = {
  datasets: Dataset[];
  total: number;
  timestamp: string;
};

type DatasetRelease = {
  dataset_release_id: number;
  dataset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type DatasetReleasesResponse = {
  releases: DatasetRelease[];
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

function normalizeDatasetReleasesResponse(payload: unknown): DatasetReleasesResponse {
  const source = payload as
    | {
        releases?: DatasetRelease[];
        total?: number;
        timestamp?: string;
        data?: DatasetRelease[];
        meta?: { count?: number };
      }
    | undefined;

  const releases = Array.isArray(source?.releases)
    ? source.releases
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    releases,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : releases.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

export default function DatasetsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeOnlyInput, setActiveOnlyInput] = useState(false);
  const [typeInput, setTypeInput] = useState<"" | "collection" | "analysis_result">("");

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

  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [releasesData, setReleasesData] = useState<DatasetReleasesResponse | null>(null);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);

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

      if (
        selectedDataset &&
        !normalized.datasets.some(
          (dataset) => dataset.dataset_id === selectedDataset.dataset_id,
        )
      ) {
        setSelectedDataset(null);
        setReleasesData(null);
        setReleasesError(null);
      }
    } catch {
      setError("Could not load datasets.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDatasetReleases(dataset: Dataset) {
    setSelectedDataset(dataset);
    setIsLoadingReleases(true);
    setReleasesError(null);

    try {
      const response = await fetch(`/api/datasets/${dataset.dataset_id}/releases`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as unknown;
      setReleasesData(normalizeDatasetReleasesResponse(json));
    } catch {
      setReleasesData(null);
      setReleasesError(
        `Could not load releases for dataset ${dataset.dataset_id}.`,
      );
    } finally {
      setIsLoadingReleases(false);
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
  }, [filters]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Datasets</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/datasets</code> and renders dataset records.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        <form
          onSubmit={applyFilters}
          className="grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="DOI, title, or name"
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Type</span>
            <select
              value={typeInput}
              onChange={(event) =>
                setTypeInput(
                  event.target.value as "" | "collection" | "analysis_result",
                )
              }
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20"
            >
              <option value="">All</option>
              <option value="collection">collection</option>
              <option value="analysis_result">analysis_result</option>
            </select>
          </label>

          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activeOnlyInput}
              onChange={(event) => setActiveOnlyInput(event.target.checked)}
              className="h-4 w-4"
            />
            <span>active_only</span>
          </label>

          <div className="md:col-span-4 flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Clear
            </button>
          </div>
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
                    <th className="px-2 py-2 font-medium">DOI</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Short Title</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                    <th className="px-2 py-2 font-medium">Updated</th>
                    <th className="px-2 py-2 font-medium">Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datasets.map((dataset) => (
                    <tr
                      key={dataset.dataset_id}
                      onClick={() => void loadDatasetReleases(dataset)}
                      className={`cursor-pointer border-b border-black/5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 ${
                        selectedDataset?.dataset_id === dataset.dataset_id
                          ? "bg-black/5 dark:bg-white/10"
                          : ""
                      }`}
                    >
                      <td className="px-2 py-2">{dataset.dataset_id}</td>
                      <td className="px-2 py-2">{dataset.dataset_doi}</td>
                      <td className="px-2 py-2">{dataset.dataset_type}</td>
                      <td className="px-2 py-2">
                        {dataset.dataset_short_title}
                      </td>
                      <td className="px-2 py-2">{dataset.dataset_title}</td>
                      <td className="px-2 py-2">{dataset.dataset_name}</td>
                      <td className="px-2 py-2">
                        {dataset.active ? "Yes" : "No"}
                      </td>
                      <td className="px-2 py-2">
                        {new Date(dataset.when_created).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{dataset.who_created}</td>
                      <td className="px-2 py-2">
                        {new Date(dataset.when_updated).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{dataset.who_updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click a dataset row to load related releases.
            </p>

            {selectedDataset && (
              <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
                <h2 className="text-lg font-semibold tracking-tight">
                  Releases for dataset {selectedDataset.dataset_id}
                </h2>

                {isLoadingReleases && <p className="mt-3 text-sm">Loading releases...</p>}

                {!isLoadingReleases && releasesError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {releasesError}
                  </p>
                )}

                {!isLoadingReleases && !releasesError && releasesData && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Total releases: <span className="font-medium">{releasesData.total}</span>
                    </p>

                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-black/10 dark:border-white/15">
                            <th className="px-2 py-2 font-medium">Release ID</th>
                            <th className="px-2 py-2 font-medium">Release #</th>
                            <th className="px-2 py-2 font-medium">Release Date</th>
                            <th className="px-2 py-2 font-medium">Release Notes</th>
                            <th className="px-2 py-2 font-medium">Created By</th>
                            <th className="px-2 py-2 font-medium">Updated By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {releasesData.releases.map((release) => (
                            <tr
                              key={release.dataset_release_id}
                              className="border-b border-black/5 dark:border-white/10"
                            >
                              <td className="px-2 py-2">{release.dataset_release_id}</td>
                              <td className="px-2 py-2">{release.release_number}</td>
                              <td className="px-2 py-2">
                                {new Date(release.release_date).toLocaleDateString()}
                              </td>
                              <td className="px-2 py-2">{release.release_notes}</td>
                              <td className="px-2 py-2">{release.who_created}</td>
                              <td className="px-2 py-2">{release.who_updated}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
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
