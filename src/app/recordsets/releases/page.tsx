"use client";

import { useEffect, useState } from "react";
import Table from "@/components/Table";

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

              <Table
                rows={data.datasetReleases}
                columns={[
                  { key: "dataset_release_id", label: "Dataset Release ID" },
                  { key: "dataset_id", label: "Dataset ID" },
                  { key: "release_number", label: "Release Number" },
                  { key: "release_date", label: "Release Date" },
                  { key: "release_notes", label: "Release Notes" },
                  { key: "when_created", label: "Created" },
                  { key: "who_created", label: "Who Created" },
                  { key: "when_updated", label: "Updated" },
                  { key: "who_updated", label: "Who Updated" },
                ]}
                formatters={{
                  release_date: (value) =>
                    new Date(String(value)).toLocaleDateString(),
                  when_created: (value) =>
                    new Date(String(value)).toLocaleString(),
                  when_updated: (value) =>
                    new Date(String(value)).toLocaleString(),
                }}
                getRowKey={(row) => row.dataset_release_id}
              />
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

              <Table
                rows={data.recordsetReleases}
                columns={[
                  {
                    key: "recordset_release_id",
                    label: "Recordset Release ID",
                  },
                  { key: "recordset_id", label: "Recordset ID" },
                  { key: "release_number", label: "Release Number" },
                  { key: "release_date", label: "Release Date" },
                  { key: "release_notes", label: "Release Notes" },
                  { key: "when_created", label: "Created" },
                  { key: "who_created", label: "Who Created" },
                  { key: "when_updated", label: "Updated" },
                  { key: "who_updated", label: "Who Updated" },
                ]}
                formatters={{
                  release_date: (value) =>
                    new Date(String(value)).toLocaleDateString(),
                  when_created: (value) =>
                    new Date(String(value)).toLocaleString(),
                  when_updated: (value) =>
                    new Date(String(value)).toLocaleString(),
                }}
                getRowKey={(row) => row.recordset_release_id}
              />
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
