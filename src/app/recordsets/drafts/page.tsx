"use client";

import { useEffect, useState } from "react";
import DynamicTable from "@/components/DynamicTable";

type Draft = {
  dataset_release_draft_id: number;
  dataset_id: number;
  cloned_from_release_id: number | null;
  draft_name: string;
  draft_status: string;
  draft_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type DraftsResponse = {
  drafts: Draft[];
  total: number;
  timestamp: string;
};

export default function DraftsPage() {
  const [data, setData] = useState<DraftsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  async function loadDrafts() {
    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      }).toString();
      const response = await fetch(`/api/drafts?${query}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const json = (await response.json()) as DraftsResponse;
      setData(json);
    } catch {
      setError("Could not load drafts.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDrafts();
  }, [currentPage, itemsPerPage]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Drafts</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        This page calls <code>/api/drafts</code> and renders draft records.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total drafts: <span className="font-medium">{data.total}</span>
            </p>

            <DynamicTable
              rows={data.drafts}
              defaultItemsPerPage={4}
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
                { key: "dataset_release_draft_id", label: "Draft ID" },
                { key: "dataset_id", label: "Dataset ID" },
                { key: "cloned_from_release_id", label: "Cloned Release ID" },
                { key: "draft_name", label: "Draft Name" },
                { key: "draft_status", label: "Status" },
                { key: "draft_notes", label: "Notes" },
                { key: "who_created", label: "Created By" },
              ]}
              getRowKey={(row) => row.dataset_release_draft_id}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => void loadDrafts()}
          className="mt-4 rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Refresh
        </button>
      </section>
    </main>
  );
}
