"use client";

import { useEffect, useState } from "react";

type Dataset = {
  dataset_id: number;
  collection_id: number;
  license_id: number;
  dataset_doi: string;
  dataset_type: string;
  dataset_title: string;
  active: boolean;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type DatasetsResponse = {
  datasets: Dataset[];
  total: number;
  timestamp: string;
};

export default function DatasetsPage() {
  const [data, setData] = useState<DatasetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDatasets() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/datasets", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as DatasetsResponse;
      setData(json);
    } catch {
      setError("Could not load datasets.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDatasets();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Datasets</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/datasets</code> and renders dataset records.
      </p>

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
                    <th className="px-2 py-2 font-medium">Collection ID</th>
                    <th className="px-2 py-2 font-medium">License ID</th>
                    <th className="px-2 py-2 font-medium">DOI</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datasets.map((dataset) => (
                    <tr
                      key={dataset.dataset_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">{dataset.dataset_id}</td>
                      <td className="px-2 py-2">{dataset.collection_id}</td>
                      <td className="px-2 py-2">{dataset.license_id}</td>
                      <td className="px-2 py-2">{dataset.dataset_doi}</td>
                      <td className="px-2 py-2">{dataset.dataset_type}</td>
                      <td className="px-2 py-2">{dataset.dataset_title}</td>
                      <td className="px-2 py-2">
                        {dataset.active ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
