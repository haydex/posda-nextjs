"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Recordset = {
  recordset_id: number;
  recordset_doi: string;
  dataset_id: number;
  license_id: number;
  recordset_type: string;
  recordset_title: string;
  active: boolean;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
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

export default function RecordsetsPage() {
  const [data, setData] = useState<RecordsetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  async function loadRecordsets() {
    setIsLoading(true);
    setError(null);

    try {
      const apiParams = new URLSearchParams();
      const supportedFilters = ["dataset_id", "search", "active_only"];

      for (const key of supportedFilters) {
        const value = searchParams.get(key);
        if (value !== null) {
          apiParams.set(key, value);
        }
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
      setData(normalizeRecordsetsResponse(json));
    } catch {
      setError("Could not load recordsets.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecordsets();
  }, [searchParams]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Recordsets</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/recordsets</code> and renders recordset
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
                    <th className="px-2 py-2 font-medium">License ID</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                    <th className="px-2 py-2 font-medium">Updated</th>
                    <th className="px-2 py-2 font-medium">Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recordsets.map((recordset) => (
                    <tr
                      key={recordset.recordset_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">{recordset.recordset_id}</td>
                      <td className="px-2 py-2">{recordset.recordset_doi}</td>
                      <td className="px-2 py-2">{recordset.dataset_id}</td>
                      <td className="px-2 py-2">{recordset.license_id}</td>
                      <td className="px-2 py-2">{recordset.recordset_type}</td>
                      <td className="px-2 py-2">{recordset.recordset_title}</td>
                      <td className="px-2 py-2">
                        {recordset.active ? "Yes" : "No"}
                      </td>
                      <td className="px-2 py-2">
                        {new Date(recordset.when_created).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{recordset.who_created}</td>
                      <td className="px-2 py-2">
                        {new Date(recordset.when_updated).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{recordset.who_updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
