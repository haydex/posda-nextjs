"use client";

import { useEffect, useState } from "react";

type Collection = {
  collection_id: number;
  collection_code: string;
  collection_type: number;
  collection_short_title: string;
  collection_title: string;
  collection_name: string;
  active: boolean;
  when_created: string;
  who_created: string;
};

type CollectionsResponse = {
  collections: Collection[];
  total: number;
  timestamp: string;
};

export default function CollectionsPage() {
  const [data, setData] = useState<CollectionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCollections() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/collections", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as CollectionsResponse;
      setData(json);
    } catch {
      setError("Could not load collections.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCollections();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/collections</code> and renders collection
        records.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total collections:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">ID</th>
                    <th className="px-2 py-2 font-medium">Code</th>
                    <th className="px-2 py-2 font-medium">Short Title</th>
                    <th className="px-2 py-2 font-medium">Collection Name</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.collections.map((collection) => (
                    <tr
                      key={collection.collection_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">{collection.collection_id}</td>
                      <td className="px-2 py-2">
                        {collection.collection_code}
                      </td>
                      <td className="px-2 py-2">
                        {collection.collection_short_title}
                      </td>
                      <td className="px-2 py-2">
                        {collection.collection_name}
                      </td>
                      <td className="px-2 py-2">
                        {collection.active ? "Yes" : "No"}
                      </td>
                      <td className="px-2 py-2">{collection.who_created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadCollections()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
