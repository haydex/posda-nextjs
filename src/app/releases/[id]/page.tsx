"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DatasetRelease = {
  dataset_release_id: number;
  dataset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type RecordsetRelease = {
  recordset_release_id: number;
  recordset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type ReleaseResponse = {
  releaseType: "dataset" | "recordset";
  release: DatasetRelease | RecordsetRelease;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ReleaseByIdPage({ params }: PageProps) {
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [data, setData] = useState<ReleaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRelease() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setReleaseId(id);

      try {
        const response = await fetch(`/api/releases/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load release ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as ReleaseResponse;

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
          setError(`Could not load release ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRelease();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Release Details</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {releaseId ? `Showing /releases/${releaseId}` : "Loading release id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && data && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Release Type</dt>
              <dd>
                {data.releaseType === "dataset" ? "Dataset" : "Recordset"}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Release ID</dt>
              <dd>
                {data.releaseType === "dataset"
                  ? (data.release as DatasetRelease).dataset_release_id
                  : (data.release as RecordsetRelease).recordset_release_id}
              </dd>
            </div>
            <div>
              <dt className="font-medium">
                {data.releaseType === "dataset" ? "Dataset ID" : "Recordset ID"}
              </dt>
              <dd>
                {data.releaseType === "dataset"
                  ? (data.release as DatasetRelease).dataset_id
                  : (data.release as RecordsetRelease).recordset_id}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Release Number</dt>
              <dd>{data.release.release_number}</dd>
            </div>
            <div>
              <dt className="font-medium">Release Date</dt>
              <dd>
                {new Date(data.release.release_date).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Created By</dt>
              <dd>{data.release.who_created}</dd>
            </div>
            <div>
              <dt className="font-medium">Created At</dt>
              <dd>{new Date(data.release.when_created).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated By</dt>
              <dd>{data.release.who_updated}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated At</dt>
              <dd>{new Date(data.release.when_updated).toLocaleString()}</dd>
            </div>
            <div className="col-span-full">
              <dt className="font-medium">Release Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap text-xs">
                {data.release.release_notes}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={releaseId ? `/releases/${releaseId}/recordsets` : "/releases"}
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            View Related Recordsets
          </Link>

          <Link
            href="/releases"
            className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Back to Releases
          </Link>
        </div>
      </section>
    </main>
  );
}
