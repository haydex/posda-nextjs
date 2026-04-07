"use client";

import { useEffect, useState } from "react";

type Transfer = {
  dataset_release_transfer_id: number;
  dataset_release_id: number;
  destination_id: number;
  transfer_name: string;
  transfer_mode: string;
  transfer_status: string;
  transfer_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type TransfersResponse = {
  transfers: Transfer[];
  total: number;
  timestamp: string;
};

function normalizeTransfersResponse(payload: unknown): TransfersResponse {
  const source = payload as
    | {
        transfers?: Transfer[];
        total?: number;
        timestamp?: string;
        data?: Transfer[];
        meta?: { count?: number };
      }
    | undefined;

  const transfers = Array.isArray(source?.transfers)
    ? source.transfers
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    transfers,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : transfers.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

export default function TransfersPage() {
  const [data, setData] = useState<TransfersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTransfers() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/transfers", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as unknown;
      setData(normalizeTransfersResponse(json));
    } catch {
      setError("Could not load transfers.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTransfers();
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Transfers</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/transfers</code> and renders dataset release
        transfer records.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total transfers: <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">ID</th>
                    <th className="px-2 py-2 font-medium">
                      Dataset Release ID
                    </th>
                    <th className="px-2 py-2 font-medium">Destination ID</th>
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Mode</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Notes</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                    <th className="px-2 py-2 font-medium">Updated</th>
                    <th className="px-2 py-2 font-medium">Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transfers.map((transfer) => (
                    <tr
                      key={transfer.dataset_release_transfer_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">
                        {transfer.dataset_release_transfer_id}
                      </td>
                      <td className="px-2 py-2">
                        {transfer.dataset_release_id}
                      </td>
                      <td className="px-2 py-2">{transfer.destination_id}</td>
                      <td className="px-2 py-2">{transfer.transfer_name}</td>
                      <td className="px-2 py-2">{transfer.transfer_mode}</td>
                      <td className="px-2 py-2">{transfer.transfer_status}</td>
                      <td className="px-2 py-2">{transfer.transfer_notes}</td>
                      <td className="px-2 py-2">
                        {new Date(transfer.when_created).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{transfer.who_created}</td>
                      <td className="px-2 py-2">
                        {new Date(transfer.when_updated).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{transfer.who_updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadTransfers()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
