"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Dataset = {
  dataset_id: number;
  dataset_doi: string;
  dataset_type: string;
  dataset_short_title: string;
  dataset_title: string;
  dataset_name: string;
  active: boolean;
  when_created: string;
  when_updated: string;
  who_created: string;
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

type DatasetRecordsetsResponse = {
  dataset: Dataset;
  recordsets: Recordset[];
  total: number;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function DatasetRecordsetsPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [data, setData] = useState<DatasetRecordsetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDatasetRecordsets() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setDatasetId(id);

      try {
        const apiParams = new URLSearchParams();
        const activeOnly = searchParams.get("active_only");

        if (activeOnly) {
          apiParams.set("active_only", activeOnly);
        }

        const query = apiParams.toString();
        const endpoint = query
          ? `/api/datasets/${id}/recordsets?${query}`
          : `/api/datasets/${id}/recordsets`;

        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load recordsets for dataset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as DatasetRecordsetsResponse;

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
          setError(`Could not load recordsets for dataset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDatasetRecordsets();

    return () => {
      isMounted = false;
    };
  }, [params, searchParams]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Dataset Recordsets
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {datasetId
          ? `Showing /datasets/${datasetId}/recordsets`
          : "Loading dataset id..."}
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
                <dt className="font-medium">Dataset ID</dt>
                <dd>{data.dataset.dataset_id}</dd>
              </div>
              <div>
                <dt className="font-medium">DOI</dt>
                <dd>{data.dataset.dataset_doi}</dd>
              </div>
              <div>
                <dt className="font-medium">Type</dt>
                <dd>{data.dataset.dataset_type}</dd>
              </div>
              <div>
                <dt className="font-medium">Short Title</dt>
                <dd>{data.dataset.dataset_short_title}</dd>
              </div>
              <div className="col-span-full">
                <dt className="font-medium">Title</dt>
                <dd>{data.dataset.dataset_title}</dd>
              </div>
              <div className="col-span-full">
                <dt className="font-medium">Name</dt>
                <dd>{data.dataset.dataset_name}</dd>
              </div>
              <div>
                <dt className="font-medium">Active</dt>
                <dd>{data.dataset.active ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="font-medium">Created By</dt>
                <dd>{data.dataset.who_created}</dd>
              </div>
              <div>
                <dt className="font-medium">Created At</dt>
                <dd>{new Date(data.dataset.when_created).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium">Updated By</dt>
                <dd>{data.dataset.who_updated}</dd>
              </div>
              <div>
                <dt className="font-medium">Updated At</dt>
                <dd>{new Date(data.dataset.when_updated).toLocaleString()}</dd>
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
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Active</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
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
                      <td className="px-2 py-2">{recordset.recordset_type}</td>
                      <td className="px-2 py-2">{recordset.recordset_title}</td>
                      <td className="px-2 py-2">
                        {recordset.active ? "Yes" : "No"}
                      </td>
                      <td className="px-2 py-2">{recordset.who_created}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={datasetId ? `/datasets/${datasetId}` : "/datasets"}
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Back to Dataset
          </Link>
          <Link
            href="/datasets"
            className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Back to Datasets
          </Link>
        </div>
      </section>
    </main>
  );
}
