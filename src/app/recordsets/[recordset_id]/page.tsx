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

type RecordsetResponse = {
  recordset: Recordset;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function RecordsetByIdPage({ params }: PageProps) {
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecordset() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setRecordsetId(id);

      try {
        const response = await fetch(`/api/recordsets/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load recordset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as RecordsetResponse;

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
          setError(`Could not load recordset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecordset();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Recordset Details
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {recordsetId
          ? `Showing /recordsets/${recordsetId}`
          : "Loading recordset id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
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
              <dt className="font-medium">License ID</dt>
              <dd>{data.recordset.license_id}</dd>
            </div>
            <div>
              <dt className="font-medium">Type</dt>
              <dd>{data.recordset.recordset_type}</dd>
            </div>
            <div>
              <dt className="font-medium">Active</dt>
              <dd>{data.recordset.active ? "Yes" : "No"}</dd>
            </div>
            <div className="col-span-full">
              <dt className="font-medium">Title</dt>
              <dd>{data.recordset.recordset_title}</dd>
            </div>
            <div>
              <dt className="font-medium">Created By</dt>
              <dd>{data.recordset.who_created}</dd>
            </div>
            <div>
              <dt className="font-medium">Created At</dt>
              <dd>{new Date(data.recordset.when_created).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated By</dt>
              <dd>{data.recordset.who_updated}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated At</dt>
              <dd>{new Date(data.recordset.when_updated).toLocaleString()}</dd>
            </div>
          </dl>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={
              recordsetId ? `/recordsets/${recordsetId}/drafts` : "/recordsets"
            }
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            View Related Drafts
          </Link>

          <Link
            href={
              recordsetId
                ? `/recordsets/${recordsetId}/releases`
                : "/recordsets"
            }
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            View Related Releases
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
