"use client";

import { useEffect, useState } from "react";
import Table from "@/components/Table";

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

            <Table
              rows={data.transfers}
              columns={[
                { key: "dataset_release_transfer_id", label: "ID" },
                { key: "dataset_release_id", label: "Dataset Release ID" },
                { key: "destination_id", label: "Destination ID" },
                { key: "transfer_name", label: "Name" },
                { key: "transfer_mode", label: "Mode" },
                { key: "transfer_status", label: "Status" },
                { key: "transfer_notes", label: "Notes" },
                { key: "when_created", label: "Created" },
                { key: "who_created", label: "Created By" },
                { key: "when_updated", label: "Updated" },
                { key: "who_updated", label: "Updated By" },
              ]}
              formatters={{
                when_created: (value) =>
                  new Date(String(value)).toLocaleString(),
                when_updated: (value) =>
                  new Date(String(value)).toLocaleString(),
              }}
              getRowKey={(row) => row.dataset_release_transfer_id}
            />
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
