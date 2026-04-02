"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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

export default function DatasetsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DatasetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDatasets() {
    setIsLoading(true);
    setError(null);

    try {
      const apiParams = new URLSearchParams();
      const search = searchParams.get("search");
      const activeOnly = searchParams.get("active_only");
      const type = searchParams.get("type");

      if (search) {
        apiParams.set("search", search);
      }

      if (activeOnly) {
        apiParams.set("active_only", activeOnly);
      }

      if (type) {
        apiParams.set("type", type);
      }

      const query = apiParams.toString();
      const endpoint = query ? `/api/datasets?${query}` : "/api/datasets";

      const response = await fetch(endpoint, { cache: "no-store" });

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
  }, [searchParams]);

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
                      className="border-b border-black/5 dark:border-white/10"
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
