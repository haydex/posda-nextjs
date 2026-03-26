"use client";

import { useEffect, useState } from "react";

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
};

type ReleasesResponse = {
  datasetReleases: DatasetRelease[];
  recordsetReleases: RecordsetRelease[];
  totalDatasetReleases: number;
  totalRecordsetReleases: number;
  timestamp: string;
};

export default function ReleasesPage() {
  const [data, setData] = useState<ReleasesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReleases() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/releases", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as ReleasesResponse;
      setData(json);
    } catch {
      setError("Could not load releases.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReleases();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Releases</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/releases</code> and renders dataset release
        and recordset release tables.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-8">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Dataset Releases
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Total dataset releases:{" "}
                  <span className="font-medium">
                    {data.totalDatasetReleases}
                  </span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/15">
                      <th className="px-2 py-2 font-medium">ID</th>
                      <th className="px-2 py-2 font-medium">Dataset ID</th>
                      <th className="px-2 py-2 font-medium">Release #</th>
                      <th className="px-2 py-2 font-medium">Release Date</th>
                      <th className="px-2 py-2 font-medium">Release Notes</th>
                      <th className="px-2 py-2 font-medium">Created</th>
                      <th className="px-2 py-2 font-medium">Created By</th>
                      <th className="px-2 py-2 font-medium">Updated</th>
                      <th className="px-2 py-2 font-medium">Updated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.datasetReleases.map((release) => (
                      <tr
                        key={release.dataset_release_id}
                        className="border-b border-black/5 dark:border-white/10"
                      >
                        <td className="px-2 py-2">
                          {release.dataset_release_id}
                        </td>
                        <td className="px-2 py-2">{release.dataset_id}</td>
                        <td className="px-2 py-2">{release.release_number}</td>
                        <td className="px-2 py-2">
                          {new Date(release.release_date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-2">{release.release_notes}</td>
                        <td className="px-2 py-2">
                          {new Date(release.when_created).toLocaleString()}
                        </td>
                        <td className="px-2 py-2">{release.who_created}</td>
                        <td className="px-2 py-2">
                          {new Date(release.when_updated).toLocaleString()}
                        </td>
                        <td className="px-2 py-2">{release.who_updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Recordset Releases
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Total recordset releases:{" "}
                  <span className="font-medium">
                    {data.totalRecordsetReleases}
                  </span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/15">
                      <th className="px-2 py-2 font-medium">ID</th>
                      <th className="px-2 py-2 font-medium">Recordset ID</th>
                      <th className="px-2 py-2 font-medium">Release #</th>
                      <th className="px-2 py-2 font-medium">Release Date</th>
                      <th className="px-2 py-2 font-medium">Release Notes</th>
                      <th className="px-2 py-2 font-medium">Created</th>
                      <th className="px-2 py-2 font-medium">Created By</th>
                      <th className="px-2 py-2 font-medium">Updated</th>
                      <th className="px-2 py-2 font-medium">Updated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recordsetReleases.map((release) => (
                      <tr
                        key={release.recordset_release_id}
                        className="border-b border-black/5 dark:border-white/10"
                      >
                        <td className="px-2 py-2">
                          {release.recordset_release_id}
                        </td>
                        <td className="px-2 py-2">{release.recordset_id}</td>
                        <td className="px-2 py-2">{release.release_number}</td>
                        <td className="px-2 py-2">
                          {new Date(release.release_date).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-2">{release.release_notes}</td>
                        <td className="px-2 py-2">
                          {new Date(release.when_created).toLocaleString()}
                        </td>
                        <td className="px-2 py-2">{release.who_created}</td>
                        <td className="px-2 py-2">
                          {new Date(release.when_updated).toLocaleString()}
                        </td>
                        <td className="px-2 py-2">{release.who_updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadReleases()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
