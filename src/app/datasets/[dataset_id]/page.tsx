"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";
import DynamicTable from "@/components/DynamicTable";

type Dataset = {
  dataset_id: number;
  dataset_type_id: number;
  dataset_type_name: string;
  dataset_doi: string;
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

type DatasetRelease = {
  dataset_release_id: number;
  dataset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
};

type DatasetReleasesResponse = {
  releases: DatasetRelease[];
  total: number;
  timestamp: string;
};

type DatasetRecordset = {
  recordset_id: number;
  recordset_doi: string | null;
  dataset_id: number;
  license_id: number;
  license_label: string;
  recordset_type_id: number;
  recordset_type_name: string;
  recordset_name: string;
  active: boolean;
  when_created?: string;
  when_updated?: string;
};

type DatasetRecordsetsResponse = {
  recordsets: DatasetRecordset[];
  total: number;
  timestamp: string;
};

function normalizeDatasetReleasesResponse(
  payload: unknown,
): DatasetReleasesResponse {
  const source = payload as
    | {
        releases?: DatasetRelease[];
        total?: number;
        timestamp?: string;
        data?: DatasetRelease[];
        meta?: { count?: number };
      }
    | undefined;

  const releases = Array.isArray(source?.releases)
    ? source.releases
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    releases,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : releases.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

function normalizeDatasetRecordsetsResponse(
  payload: unknown,
): DatasetRecordsetsResponse {
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

type PageProps = {
  params: Promise<{
    dataset_id: string;
  }>;
};

export default function DatasetByIdPage({ params }: PageProps) {
  const router = useRouter();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordsetsPage, setRecordsetsPage] = useState(1);
  const [recordsetsItemsPerPage, setRecordsetsItemsPerPage] = useState(5);
  const [releasesPage, setReleasesPage] = useState(1);
  const [releasesItemsPerPage, setReleasesItemsPerPage] = useState(4);
  const [releasesData, setReleasesData] =
    useState<DatasetReleasesResponse | null>(null);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [recordsetsData, setRecordsetsData] =
    useState<DatasetRecordsetsResponse | null>(null);
  const [isLoadingRecordsets, setIsLoadingRecordsets] = useState(false);
  const [recordsetsError, setRecordsetsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDataset() {
      setIsLoading(true);
      setError(null);
      setIsLoadingReleases(true);
      setReleasesError(null);
      setIsLoadingRecordsets(true);
      setRecordsetsError(null);

      const { dataset_id } = await params;
      const id = dataset_id;
      if (!isMounted) {
        return;
      }

      if (!id) {
        setError("Could not load dataset id.");
        setData(null);
        setIsLoading(false);
        setReleasesData(null);
        setIsLoadingReleases(false);
        setRecordsetsData(null);
        setIsLoadingRecordsets(false);
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

        try {
          const recordsetsQuery = new URLSearchParams({
            dataset_id: id,
            page: String(recordsetsPage),
            limit: String(recordsetsItemsPerPage),
          }).toString();
          const recordsetsResponse = await fetch(
            `/api/recordsets?${recordsetsQuery}`,
            {
              cache: "no-store",
            },
          );

          if (!recordsetsResponse.ok) {
            throw new Error(`Could not load recordsets for dataset ${id}.`);
          }

          const recordsetsJson = (await recordsetsResponse.json()) as unknown;

          if (!isMounted) {
            return;
          }

          setRecordsetsData(normalizeDatasetRecordsetsResponse(recordsetsJson));
        } catch (caughtError) {
          if (!isMounted) {
            return;
          }

          setRecordsetsData(null);
          if (caughtError instanceof Error) {
            setRecordsetsError(caughtError.message);
          } else {
            setRecordsetsError(`Could not load recordsets for dataset ${id}.`);
          }
        } finally {
          if (isMounted) {
            setIsLoadingRecordsets(false);
          }
        }

        const releasesQuery = new URLSearchParams({
          page: String(releasesPage),
          limit: String(releasesItemsPerPage),
        }).toString();
        const releasesResponse = await fetch(
          `/api/datasets/${id}/releases?${releasesQuery}`,
          {
            cache: "no-store",
          },
        );

        if (!releasesResponse.ok) {
          throw new Error(`Could not load releases for dataset ${id}.`);
        }

        const releasesJson = (await releasesResponse.json()) as unknown;

        if (!isMounted) {
          return;
        }

        setReleasesData(normalizeDatasetReleasesResponse(releasesJson));
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (
          caughtError instanceof Error &&
          caughtError.message.includes("releases")
        ) {
          setReleasesData(null);
          setReleasesError(caughtError.message);
        } else if (
          caughtError instanceof Error &&
          caughtError.message.includes("recordsets")
        ) {
          setRecordsetsData(null);
          setRecordsetsError(caughtError.message);
        } else {
          if (caughtError instanceof Error) {
            setError(caughtError.message);
          } else {
            setError(`Could not load dataset ${id}.`);
          }

          setData(null);
          setReleasesData(null);
          setRecordsetsData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingReleases(false);
          setIsLoadingRecordsets(false);
        }
      }
    }

    void loadDataset();

    return () => {
      isMounted = false;
    };
  }, [
    params,
    recordsetsPage,
    recordsetsItemsPerPage,
    releasesPage,
    releasesItemsPerPage,
  ]);

  const dataset = data?.dataset ?? data?.data ?? null;
  const datasetFields: DynamicSectionField[] = dataset
    ? [
        { label: "Dataset ID", value: dataset.dataset_id },
        { label: "Type", value: dataset.dataset_type_name },
        { label: "DOI", value: dataset.dataset_doi },
        { label: "Name", value: dataset.dataset_name, fullWidth: true },
        { label: "Active", value: dataset.active ? "Yes" : "No" },
        { label: "Created By", value: dataset.who_created },
        {
          label: "Created At",
          value: new Date(dataset.when_created).toLocaleString(),
        },
        { label: "Updated By", value: dataset.who_updated },
        {
          label: "Updated At",
          value: new Date(dataset.when_updated).toLocaleString(),
        },
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <div className="border-b-2 border-black pb-4 dark:border-white">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Dataset Details</h1>
          <div className="flex gap-3">
            <Link
              href={datasetId ? `/datasets/${datasetId}/edit` : "/datasets"}
              className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Edit Dataset
            </Link>

            <Link
              href="/datasets"
              className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Back to Datasets
            </Link>
          </div>
        </div>
      </div>

      <DynamicSection
        isLoading={isLoading}
        error={error}
        fields={datasetFields}
        actions={
          <></>
        }
      >
        {!isLoading && dataset && (
          <>
            <div className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
              <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                Recordsets
              </h2>

              {isLoadingRecordsets && (
                <p className="mt-3 text-sm">Loading recordsets...</p>
              )}

              {!isLoadingRecordsets && recordsetsError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {recordsetsError}
                </p>
              )}

              {!isLoadingRecordsets && !recordsetsError && recordsetsData && (
                <div className="mt-3 space-y-3">
                  {/* <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Total recordsets:{" "}
                    <span className="font-medium">{recordsetsData.total}</span>
                  </p> */}

                  {recordsetsData.recordsets.length === 0 ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      No recordsets were found for this dataset.
                    </p>
                  ) : (
                    <DynamicTable
                      rows={recordsetsData.recordsets}
                      defaultItemsPerPage={5}
                      totalItems={recordsetsData.total}
                      currentPage={recordsetsPage}
                      currentItemsPerPage={recordsetsItemsPerPage}
                      paginateRows={false}
                      onPageChange={setRecordsetsPage}
                      onItemsPerPageChange={(nextItemsPerPage) => {
                        setRecordsetsItemsPerPage(nextItemsPerPage);
                        setRecordsetsPage(1);
                      }}
                      columns={[
                        { key: "recordset_id", label: "ID" },
                        { key: "recordset_name", label: "Name" },
                        { key: "recordset_type_name", label: "Type" },
                        { key: "license_label", label: "License" },
                        { key: "recordset_doi", label: "DOI" },
                        { key: "active", label: "Active" },
                        { key: "when_updated", label: "Updated" },
                      ]}
                      formatters={{
                        when_updated: (value) =>
                          formatDateTime(value as string),
                      }}
                      onRowClick={(row) =>
                        router.push(`/recordsets/${row.recordset_id}`)
                      }
                      getRowKey={(row) => row.recordset_id}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
              <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                Releases
              </h2>

              {isLoadingReleases && (
                <p className="mt-3 text-sm">Loading releases...</p>
              )}

              {!isLoadingReleases && releasesError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {releasesError}
                </p>
              )}

              {!isLoadingReleases && !releasesError && releasesData && (
                <div className="mt-3 space-y-3">
                  {/* <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Total releases:{" "}
                    <span className="font-medium">{releasesData.total}</span>
                  </p> */}

                  <DynamicTable
                    rows={releasesData.releases}
                    defaultItemsPerPage={4}
                    totalItems={releasesData.total}
                    currentPage={releasesPage}
                    currentItemsPerPage={releasesItemsPerPage}
                    paginateRows={false}
                    onPageChange={setReleasesPage}
                    onItemsPerPageChange={(nextItemsPerPage) => {
                      setReleasesItemsPerPage(nextItemsPerPage);
                      setReleasesPage(1);
                    }}
                    columns={[
                      { key: "dataset_release_id", label: "ID" },
                      { key: "release_number", label: "Version" },
                      { key: "release_date", label: "Date" },
                      { key: "release_notes", label: "Notes" },
                    ]}
                    formatters={{
                      release_date: (value) =>
                        new Date(String(value)).toLocaleDateString(),
                    }}
                    getRowKey={(row) => row.dataset_release_id}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </DynamicSection>
    </main>
  );
}
