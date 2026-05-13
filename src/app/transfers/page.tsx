"use client";

import { useEffect, useState } from "react";
import DynamicTable from "@/components/DynamicTable";
import { Button } from "@/components/ui/Button";
import {
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
} from "@/components/ui/Page";
import { SectionCard } from "@/components/ui/Card";

type Transfer = {
  dataset_release_transfer_id: number;
  dataset_release_id: number;
  destination_id: number;
  transfer_name: string;
  transfer_mode: string;
  transfer_status: string;
  transfer_notes?: string | null;
  when_created?: string;
  who_created?: string;
  when_updated?: string;
  who_updated?: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  async function loadTransfers() {
    setIsLoading(true);
    setError(null);

    try {
      const apiParams = new URLSearchParams();
      apiParams.set("page", String(currentPage));
      apiParams.set("limit", String(itemsPerPage));

      const query = apiParams.toString();
      const endpoint = query ? `/api/transfers?${query}` : "/api/transfers";
      const response = await fetch(endpoint, { cache: "no-store" });

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
  }, [currentPage, itemsPerPage]);

  return (
    <PageShell size="6xl">
      <PageHeader>
        <PageTitle>Transfers</PageTitle>
      </PageHeader>
      <PageSubtitle>
        This page calls <code>/api/transfers</code> and renders dataset release
        transfer records.
      </PageSubtitle>

      <SectionCard>
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total transfers: <span className="font-medium">{data.total}</span>
            </p>

            <DynamicTable
              rows={data.transfers}
              defaultItemsPerPage={6}
              totalItems={data.total}
              currentPage={currentPage}
              currentItemsPerPage={itemsPerPage}
              paginateRows={false}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(nextItemsPerPage) => {
                setItemsPerPage(nextItemsPerPage);
                setCurrentPage(1);
              }}
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

        <Button
          type="button"
          onClick={() => void loadTransfers()}
          className="mt-4"
        >
          Refresh
        </Button>
      </SectionCard>
    </PageShell>
  );
}
