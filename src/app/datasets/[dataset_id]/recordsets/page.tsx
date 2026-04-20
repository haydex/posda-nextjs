"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DatasetRecordset = {
  recordset_id: number;
  recordset_doi: string | null;
  dataset_id: number;
  license_id: number;
  recordset_type: string;
  recordset_title: string;
  recordset_name?: string;
  active: boolean;
  when_created?: string;
  when_updated?: string;
};

type RecordsetsResponse = {
  recordsets: DatasetRecordset[];
  total: number;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    dataset_id: string;
  }>;
};

function normalizeRecordsetsResponse(payload: unknown): RecordsetsResponse {
  const source = payload as
    | {
        recordsets?: DatasetRecordset[];
        total?: number;
        timestamp?: string;
        data?: DatasetRecordset[];
        meta?: { count?: number };
      }
    | undefined;

  const recordsets = Array.isArray(source?.recordsets)
    ? source.recordsets
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    recordsets,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : recordsets.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "-";
  }

  return new Date(parsed).toLocaleString();
}

export default function DatasetRecordsetsPage({ params }: PageProps) {
  const router = useRouter();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecordsets() {
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
        const query = new URLSearchParams({ dataset_id: id }).toString();
        const response = await fetch(`/api/recordsets?${query}`, {
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

        const payload = (await response.json()) as unknown;
        if (!isMounted) {
          return;
        }

        const normalized = normalizeRecordsetsResponse(payload);
        setData(normalized);
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

    void loadRecordsets();

    return () => {
      isMounted = false;
    };
  }, [params]);

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
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Total recordsets:{" "}
              <span className="font-medium">{data.total}</span>
            </p>

            {data.recordsets.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                No recordsets were found for this dataset.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/15">
                      <th className="px-2 py-2 font-medium">ID</th>
                      <th className="px-2 py-2 font-medium">Name</th>
                      <th className="px-2 py-2 font-medium">Title</th>
                      <th className="px-2 py-2 font-medium">DOI</th>
                      <th className="px-2 py-2 font-medium">Type</th>
                      <th className="px-2 py-2 font-medium">Active</th>
                      <th className="px-2 py-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recordsets.map((recordset) => (
                      <tr
                        key={recordset.recordset_id}
                        onClick={() =>
                          router.push(`/recordsets/${recordset.recordset_id}`)
                        }
                        className="cursor-pointer border-b border-black/5 transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                      >
                        <td className="px-2 py-2">{recordset.recordset_id}</td>
                        <td className="px-2 py-2">
                          {recordset.recordset_name ?? "-"}
                        </td>
                        <td className="px-2 py-2">
                          {recordset.recordset_title}
                        </td>
                        <td className="px-2 py-2">
                          {recordset.recordset_doi ?? "-"}
                        </td>
                        <td className="px-2 py-2">
                          {recordset.recordset_type}
                        </td>
                        <td className="px-2 py-2">
                          {recordset.active ? "Yes" : "No"}
                        </td>
                        <td className="px-2 py-2">
                          {formatDateTime(recordset.when_updated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.recordsets.length > 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click a recordset row to view its details.
              </p>
            )}
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
            href="/recordsets"
            className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Browse All Recordsets
          </Link>
        </div>
      </section>
    </main>
  );
}
