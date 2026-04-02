"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type DatasetReleasesResponse = {
  dataset: Dataset;
  releases: DatasetRelease[];
  total: number;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function DatasetReleasesPage({ params }: PageProps) {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [data, setData] = useState<DatasetReleasesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const latestOnlyParam = searchParams.get("latest_only");

  useEffect(() => {
    let isMounted = true;

    async function loadDatasetReleases() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setDatasetId(id);

      try {
        const apiParams = new URLSearchParams();
        if (latestOnlyParam !== null) {
          apiParams.set("latest_only", latestOnlyParam);
        }

        const apiUrl =
          apiParams.size > 0
            ? `/api/datasets/${id}/releases?${apiParams.toString()}`
            : `/api/datasets/${id}/releases`;

        const response = await fetch(apiUrl, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load releases for dataset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as DatasetReleasesResponse;

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
          setError(`Could not load releases for dataset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDatasetReleases();

    return () => {
      isMounted = false;
    };
  }, [params, latestOnlyParam]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Dataset Releases
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {datasetId
          ? `Showing /datasets/${datasetId}/releases`
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
              Total related releases:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/15">
                    <th className="px-2 py-2 font-medium">Release ID</th>
                    <th className="px-2 py-2 font-medium">Release #</th>
                    <th className="px-2 py-2 font-medium">Release Date</th>
                    <th className="px-2 py-2 font-medium">Release Notes</th>
                    <th className="px-2 py-2 font-medium">Created By</th>
                    <th className="px-2 py-2 font-medium">Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.releases.map((release) => (
                    <tr
                      key={release.dataset_release_id}
                      className="border-b border-black/5 dark:border-white/10"
                    >
                      <td className="px-2 py-2">
                        {release.dataset_release_id}
                      </td>
                      <td className="px-2 py-2">{release.release_number}</td>
                      <td className="px-2 py-2">
                        {new Date(release.release_date).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2">{release.release_notes}</td>
                      <td className="px-2 py-2">{release.who_created}</td>
                      <td className="px-2 py-2">{release.who_updated}</td>
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
