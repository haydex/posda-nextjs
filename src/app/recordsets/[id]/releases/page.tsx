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

type RecordsetReleasesResponse = {
  recordset: Recordset;
  releases: RecordsetRelease[];
  total: number;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function RecordsetReleasesPage({ params }: PageProps) {
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetReleasesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecordsetReleases() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setRecordsetId(id);

      try {
        const response = await fetch(`/api/recordsets/${id}/releases`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load releases for recordset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as RecordsetReleasesResponse;

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
          setError(`Could not load releases for recordset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecordsetReleases();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Recordset Releases
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {recordsetId
          ? `Showing /recordsets/${recordsetId}/releases`
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
              Total related releases:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">Release ID</th>
                    <th className="px-2 py-2 font-medium">Recordset ID</th>
                    <th className="px-2 py-2 font-medium">Release #</th>
                    <th className="px-2 py-2 font-medium">Release Date</th>
                    <th className="px-2 py-2 font-medium">Release Notes</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.releases.map((release) => (
                    <tr
                      key={release.recordset_release_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">
                        {release.recordset_release_id}
                      </td>
                      <td className="px-2 py-2">{release.recordset_id}</td>
                      <td className="px-2 py-2">{release.release_number}</td>
                      <td className="px-2 py-2">
                        {new Date(release.release_date).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2">{release.release_notes}</td>
                      <td className="px-2 py-2">{release.who_created}</td>
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
