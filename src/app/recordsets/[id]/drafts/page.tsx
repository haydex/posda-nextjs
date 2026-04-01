"use client";

import Link from "next/link";
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

type RecordsetDraftsResponse = {
  recordset: Recordset;
  drafts: Draft[];
  total: number;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function RecordsetDraftsPage({ params }: PageProps) {
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetDraftsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecordsetDrafts() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setRecordsetId(id);

      try {
        const response = await fetch(`/api/recordsets/${id}/drafts`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load drafts for recordset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as RecordsetDraftsResponse;

        if (!isMounted) {
          return;
        }

        setData(json);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(`Could not load drafts for recordset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecordsetDrafts();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Recordset Drafts
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {recordsetId
          ? `Showing /recordsets/${recordsetId}/drafts`
          : "Loading recordset id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium">Recordset ID</dt>
                <dd>{data.recordset.recordset_id}</dd>
              </div>
              <div>
                <dt className="font-medium">DOI</dt>
                <dd>{data.recordset.recordset_doi}</dd>
              </div>
              <div>
                <dt className="font-medium">Dataset ID</dt>
                <dd>{data.recordset.dataset_id}</dd>
              </div>
              <div>
                <dt className="font-medium">Type</dt>
                <dd>{data.recordset.recordset_type}</dd>
              </div>
              <div className="col-span-full">
                <dt className="font-medium">Title</dt>
                <dd>{data.recordset.recordset_title}</dd>
              </div>
            </dl>

            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total related drafts:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">Draft ID</th>
                    <th className="px-2 py-2 font-medium">Dataset ID</th>
                    <th className="px-2 py-2 font-medium">Draft Name</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Cloned Release ID</th>
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
                      <td className="px-2 py-2">{draft.draft_name}</td>
                      <td className="px-2 py-2">{draft.draft_status}</td>
                      <td className="px-2 py-2">
                        {draft.cloned_from_release_id ?? "-"}
                      </td>
                      <td className="px-2 py-2">{draft.who_created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={recordsetId ? `/recordsets/${recordsetId}` : "/recordsets"}
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Back to Recordset
          </Link>
          <Link
            href="/recordsets"
            className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Back to Recordsets
          </Link>
        </div>
      </section>
    </main>
  );
}
