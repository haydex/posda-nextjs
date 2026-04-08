"use client";

import { FormEvent, useEffect, useState } from "react";

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

type RecordsetRelease = {
  recordset_release_id: number;
  recordset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
  file_count: number;
};

type RecordsetReleasesResponse = {
  releases: RecordsetRelease[];
  total: number;
  timestamp: string;
};

function normalizeRecordsetReleasesResponse(payload: unknown): RecordsetReleasesResponse {
  const source = payload as
    | {
        releases?: RecordsetRelease[];
        total?: number;
        timestamp?: string;
        data?: RecordsetRelease[];
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

type RecordsetDraft = {
  recordset_draft_id: number;
  recordset_id: number;
  cloned_from_release_id: number | null;
  draft_name: string;
  draft_status: string;
  draft_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
  file_count: number;
};

type RecordsetDraftsResponse = {
  drafts: RecordsetDraft[];
  total: number;
  timestamp: string;
};

function normalizeRecordsetDraftsResponse(payload: unknown): RecordsetDraftsResponse {
  const source = payload as
    | {
        drafts?: RecordsetDraft[];
        total?: number;
        timestamp?: string;
        data?: RecordsetDraft[];
        meta?: { count?: number };
      }
    | undefined;

  const drafts = Array.isArray(source?.drafts)
    ? source.drafts
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    drafts,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : drafts.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

function getDraftId(draft: RecordsetDraft) {
  return draft.recordset_draft_id;
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

  const [selectedRecordset, setSelectedRecordset] = useState<Recordset | null>(null);

  const [releasesData, setReleasesData] = useState<RecordsetReleasesResponse | null>(null);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  const [draftsData, setDraftsData] = useState<RecordsetDraftsResponse | null>(null);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);

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

      if (
        selectedRecordset &&
        !normalized.recordsets.some(
          (recordset) => recordset.recordset_id === selectedRecordset.recordset_id,
        )
      ) {
        setSelectedRecordset(null);
        setReleasesData(null);
        setReleasesError(null);
        setDraftsData(null);
        setDraftsError(null);
      }
    } catch {
      setError("Could not load recordsets.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRecordsetReleases(recordsetId: number) {
    setIsLoadingReleases(true);
    setReleasesError(null);

    try {
      const response = await fetch(`/api/recordsets/${recordsetId}/releases`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as unknown;
      setReleasesData(normalizeRecordsetReleasesResponse(json));
    } catch {
      setReleasesData(null);
      setReleasesError(`Could not load releases for recordset ${recordsetId}.`);
    } finally {
      setIsLoadingReleases(false);
    }
  }

  async function loadRecordsetDrafts(recordsetId: number) {
    setIsLoadingDrafts(true);
    setDraftsError(null);

    try {
      const response = await fetch(`/api/recordsets/${recordsetId}/drafts`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as unknown;
      setDraftsData(normalizeRecordsetDraftsResponse(json));
    } catch {
      setDraftsData(null);
      setDraftsError(`Could not load drafts for recordset ${recordsetId}.`);
    } finally {
      setIsLoadingDrafts(false);
    }
  }

  async function loadRelatedRecordsetData(recordset: Recordset) {
    setSelectedRecordset(recordset);
    await Promise.all([
      loadRecordsetReleases(recordset.recordset_id),
      loadRecordsetDrafts(recordset.recordset_id),
    ]);
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

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">ID</th>
                    <th className="px-2 py-2 font-medium">DOI</th>
                    <th className="px-2 py-2 font-medium">Dataset ID</th>
                    <th className="px-2 py-2 font-medium">License</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">When Created</th>
                    <th className="px-2 py-2 font-medium">When Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recordsets.map((recordset) => (
                    <tr
                      key={recordset.recordset_id}
                      onClick={() => void loadRelatedRecordsetData(recordset)}
                      className={`cursor-pointer border-b border-black/5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 ${
                        selectedRecordset?.recordset_id === recordset.recordset_id
                          ? "bg-black/5 dark:bg-white/10"
                          : ""
                      }`}
                    >
                      <td className="px-2 py-2">{recordset.recordset_id}</td>
                      <td className="px-2 py-2">{recordset.recordset_doi ?? "-"}</td>
                      <td className="px-2 py-2">{recordset.dataset_id}</td>
                      <td className="px-2 py-2">{recordset.license_label ?? "-"}</td>
                      <td className="px-2 py-2">{recordset.recordset_type}</td>
                      <td className="px-2 py-2">{recordset.recordset_title}</td>
                      <td className="px-2 py-2">
                        {recordset.active ? "Yes" : "No"}
                      </td>
                      <td className="px-2 py-2">
                        {formatDateTime(recordset.when_created)}
                      </td>
                      <td className="px-2 py-2">
                        {formatDateTime(recordset.when_updated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click a recordset row to load related releases and drafts.
            </p>

            {selectedRecordset && (
              <div className="flex flex-col gap-4">
                <div className="order-2 rounded-lg border border-black/10 p-4 dark:border-white/15">
                  <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                    Releases
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
                              <th className="px-2 py-2 font-medium">ID</th>
                              <th className="px-2 py-2 font-medium">Version</th>
                              <th className="px-2 py-2 font-medium">Date</th>
                              <th className="px-2 py-2 font-medium">Notes</th>
                              <th className="px-2 py-2 font-medium">File Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {releasesData.releases.map((release) => (
                              <tr
                                key={release.recordset_release_id}
                                className="border-b border-black/5 dark:border-white/10"
                              >
                                <td className="px-2 py-2">{release.recordset_release_id}</td>
                                <td className="px-2 py-2">{release.release_number}</td>
                                <td className="px-2 py-2">
                                  {new Date(release.release_date).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-2">{release.release_notes}</td>
                                <td className="px-2 py-2">{release.file_count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="order-1 rounded-lg border border-black/10 p-4 dark:border-white/15">
                  <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                    Drafts
                  </h2>

                  {isLoadingDrafts && <p className="mt-3 text-sm">Loading drafts...</p>}

                  {!isLoadingDrafts && draftsError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                      {draftsError}
                    </p>
                  )}

                  {!isLoadingDrafts && !draftsError && draftsData && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        Total drafts: <span className="font-medium">{draftsData.total}</span>
                      </p>

                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-black/10 dark:border-white/15">
                              <th className="px-2 py-2 font-medium">ID</th>
                              <th className="px-2 py-2 font-medium">Name</th>
                              <th className="px-2 py-2 font-medium">Status</th>
                              <th className="px-2 py-2 font-medium">Notes</th>
                              <th className="px-2 py-2 font-medium">File Count</th>
                              <th className="px-2 py-2 font-medium">Cloned Release ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {draftsData.drafts.map((draft, index) => (
                              <tr
                                key={getDraftId(draft) ?? `${selectedRecordset.recordset_id}-${index}`}
                                className="border-b border-black/5 dark:border-white/10"
                              >
                                <td className="px-2 py-2">{getDraftId(draft) ?? "-"}</td>
                                <td className="px-2 py-2">{draft.draft_name}</td>
                                <td className="px-2 py-2">{draft.draft_status}</td>
                                <td className="px-2 py-2">{draft.draft_notes}</td>
                                <td className="px-2 py-2">{draft.file_count}</td>
                                <td className="px-2 py-2">{draft.cloned_from_release_id ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
