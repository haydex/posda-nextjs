"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type DatasetResponse = {
  dataset?: Dataset;
  data?: Dataset;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    dataset_id: string;
  }>;
};

export default function DatasetByIdPage({ params }: PageProps) {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDataset() {
      setIsLoading(true);
      setError(null);

      const { dataset_id } = await params;
      const id = dataset_id;
      if (!isMounted) {
        return;
      }

      if (!id) {
        setError("Could not load dataset id.");
        setData(null);
        setIsLoading(false);
        return;
      }

      setDatasetId(id);

      try {
        const response = await fetch(`/api/datasets/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load dataset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as DatasetResponse;

        if (!isMounted) {
          return;
        }

        setData({ ...json, dataset: json.dataset ?? json.data });
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(`Could not load dataset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDataset();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const dataset = data?.dataset ?? data?.data ?? null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Dataset Details</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {datasetId ? `Showing /datasets/${datasetId}` : "Loading dataset id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && dataset && (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Dataset ID</dt>
              <dd>{dataset.dataset_id}</dd>
            </div>
            <div>
              <dt className="font-medium">DOI</dt>
              <dd>{dataset.dataset_doi}</dd>
            </div>
            <div>
              <dt className="font-medium">Type</dt>
              <dd>{dataset.dataset_type}</dd>
            </div>
            <div>
              <dt className="font-medium">Short Title</dt>
              <dd>{dataset.dataset_short_title}</dd>
            </div>
            <div className="col-span-full">
              <dt className="font-medium">Title</dt>
              <dd>{dataset.dataset_title}</dd>
            </div>
            <div className="col-span-full">
              <dt className="font-medium">Name</dt>
              <dd>{dataset.dataset_name}</dd>
            </div>
            <div>
              <dt className="font-medium">Active</dt>
              <dd>{dataset.active ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-medium">Created By</dt>
              <dd>{dataset.who_created}</dd>
            </div>
            <div>
              <dt className="font-medium">Created At</dt>
              <dd>{new Date(dataset.when_created).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated By</dt>
              <dd>{dataset.who_updated}</dd>
            </div>
            <div>
              <dt className="font-medium">Updated At</dt>
              <dd>{new Date(dataset.when_updated).toLocaleString()}</dd>
            </div>
          </dl>
        )}

        <div className="mt-4 flex gap-3">
          <Link
            href={datasetId ? `/datasets/${datasetId}/recordsets` : "/datasets"}
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            View Related Recordsets
          </Link>

          <Link
            href={datasetId ? `/datasets/${datasetId}/releases` : "/datasets"}
            className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            View Related Releases
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
