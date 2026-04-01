"use client";

import Link from "next/link";
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

type DraftResponse = {
  draft: Draft;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function DraftByIdPage({ params }: PageProps) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [data, setData] = useState<DraftResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setDraftId(id);

      try {
        const response = await fetch(`/api/drafts/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load draft ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as DraftResponse;

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
          setError(`Could not load draft ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDraft();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Draft Details</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {draftId ? `Showing /drafts/${draftId}` : "Loading draft id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Draft ID</dt>
              <dd>{data.draft.dataset_release_draft_id}</dd>
            </div>
            <div>
              <dt className="font-medium">Dataset ID</dt>
              <dd>{data.draft.dataset_id}</dd>
            </div>
            <div>
              <dt className="font-medium">Draft Name</dt>
              <dd>{data.draft.draft_name}</dd>
            </div>
            <div>
              <dt className="font-medium">Draft Status</dt>
              <dd>{data.draft.draft_status}</dd>
            </div>
            <div>
              <dt className="font-medium">Cloned From Release ID</dt>
              <dd>{data.draft.cloned_from_release_id ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="font-medium">Created By</dt>
              <dd>{data.draft.who_created}</dd>
            </div>
            <div>
              <dt className="font-medium">Created At</dt>
              <dd>{new Date(data.draft.when_created).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated By</dt>
              <dd>{data.draft.who_updated}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated At</dt>
              <dd>{new Date(data.draft.when_updated).toLocaleString()}</dd>
            </div>
            {data.draft.draft_notes && (
              <div className="col-span-full">
                <dt className="font-medium">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-xs">
                  {data.draft.draft_notes}
                </dd>
              </div>
            )}
          </dl>
        )}

        <Link
          href="/drafts"
          className="mt-4 inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Back to Drafts
        </Link>
      </section>
    </main>
  );
}
