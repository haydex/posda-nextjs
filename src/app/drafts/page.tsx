"use client";

import { useEffect, useState } from "react";

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

  async function loadDrafts() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/drafts", { cache: "no-store" });

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
  }, []);

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

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">Draft ID</th>
                    <th className="px-2 py-2 font-medium">Dataset ID</th>
                    <th className="px-2 py-2 font-medium">Cloned Release ID</th>
                    <th className="px-2 py-2 font-medium">Draft Name</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Notes</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.drafts.map((draft) => (
                    <tr
                      key={draft.dataset_release_draft_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">
                        {draft.dataset_release_draft_id}
                      </td>
                      <td className="px-2 py-2">{draft.dataset_id}</td>
                      <td className="px-2 py-2">
                        {draft.cloned_from_release_id ?? "-"}
                      </td>
                      <td className="px-2 py-2">{draft.draft_name}</td>
                      <td className="px-2 py-2">{draft.draft_status}</td>
                      <td className="px-2 py-2">{draft.draft_notes}</td>
                      <td className="px-2 py-2">{draft.who_created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
