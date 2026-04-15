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

function normalizeDatasetReleasesResponse(
  payload: unknown,
): DatasetReleasesResponse {
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

  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [releasesData, setReleasesData] =
    useState<DatasetReleasesResponse | null>(null);
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
      const response = await fetch(
        `/api/datasets/${dataset.dataset_id}/releases`,
        {
          cache: "no-store",
        },
      );

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
                      onClick={() => void loadDatasetReleases(dataset)}
                      className={`cursor-pointer border-b border-black/5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 ${
                        selectedDataset?.dataset_id === dataset.dataset_id
                          ? "bg-black/5 dark:bg-white/10"
                          : ""
                      }`}
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
              Click a dataset row to load related releases.
            </p>

            {selectedDataset && (
              <>
                <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
                  <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                    Dataset Details
                  </h2>

                  <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-medium">Dataset ID</dt>
                      <dd>{selectedDataset.dataset_id}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">DOI</dt>
                      <dd>{selectedDataset.dataset_doi}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Type</dt>
                      <dd>{selectedDataset.dataset_type}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Short Title</dt>
                      <dd>{selectedDataset.dataset_short_title}</dd>
                    </div>
                    <div className="col-span-full">
                      <dt className="font-medium">Title</dt>
                      <dd>{selectedDataset.dataset_title}</dd>
                    </div>
                    <div className="col-span-full">
                      <dt className="font-medium">Name</dt>
                      <dd>{selectedDataset.dataset_name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Active</dt>
                      <dd>{selectedDataset.active ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Created</dt>
                      <dd>
                        {new Date(
                          selectedDataset.when_created,
                        ).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">Updated</dt>
                      <dd>
                        {new Date(
                          selectedDataset.when_updated,
                        ).toLocaleString()}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <a
                      href={`/datasets/${selectedDataset.dataset_id}/edit`}
                      className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      Edit Dataset
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
                  <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                    Releases
                  </h2>

                  {isLoadingReleases && (
                    <p className="mt-3 text-sm">Loading releases...</p>
                  )}

                  {!isLoadingReleases && releasesError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                      {releasesError}
                    </p>
                  )}

                  {!isLoadingReleases && !releasesError && releasesData && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        Total releases:{" "}
                        <span className="font-medium">
                          {releasesData.total}
                        </span>
                      </p>

                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-black/10 dark:border-white/15">
                              <th className="px-2 py-2 font-medium">ID</th>
                              <th className="px-2 py-2 font-medium">Version</th>
                              <th className="px-2 py-2 font-medium">Date</th>
                              <th className="px-2 py-2 font-medium">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {releasesData.releases.map((release) => (
                              <tr
                                key={release.dataset_release_id}
                                className="border-b border-black/5 dark:border-white/10"
                              >
                                <td className="px-2 py-2">
                                  {release.dataset_release_id}
                                </td>
                                <td className="px-2 py-2">
                                  {release.release_number}
                                </td>
                                <td className="px-2 py-2">
                                  {new Date(
                                    release.release_date,
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-2">
                                  {release.release_notes}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
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
