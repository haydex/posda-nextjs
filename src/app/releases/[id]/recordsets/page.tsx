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

type ReleaseRecordsetsResponse = {
  releaseType: "dataset" | "recordset";
  release: DatasetRelease | RecordsetRelease;
  recordsets: Recordset[];
  total: number;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ReleaseRecordsetsPage({ params }: PageProps) {
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [data, setData] = useState<ReleaseRecordsetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReleaseRecordsets() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setReleaseId(id);

      try {
        const response = await fetch(`/api/releases/${id}/recordsets`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load recordsets for release ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as ReleaseRecordsetsResponse;

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
          setError(`Could not load recordsets for release ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReleaseRecordsets();

    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Release Recordsets
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {releaseId
          ? `Showing /releases/${releaseId}/recordsets`
          : "Loading release id..."}
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
                  {data.releaseType === "dataset"
                    ? "Dataset ID"
                    : "Recordset ID"}
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
            </dl>

            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total related recordsets:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">Recordset ID</th>
                    <th className="px-2 py-2 font-medium">DOI</th>
                    <th className="px-2 py-2 font-medium">Dataset ID</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recordsets.map((recordset) => (
                    <tr
                      key={recordset.recordset_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">{recordset.recordset_id}</td>
                      <td className="px-2 py-2">{recordset.recordset_doi}</td>
                      <td className="px-2 py-2">{recordset.dataset_id}</td>
                      <td className="px-2 py-2">{recordset.recordset_type}</td>
                      <td className="px-2 py-2">{recordset.recordset_title}</td>
                      <td className="px-2 py-2">
                        {recordset.active ? "Yes" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={releaseId ? `/releases/${releaseId}` : "/releases"}
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Back to Release
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
