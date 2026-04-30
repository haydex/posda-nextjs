"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";
import DynamicTable from "@/components/DynamicTable";

type Recordset = {
  recordset_id: number;
  recordset_doi: string;
  dataset_id: number;
  dataset_name: string;
  license_id: number;
  license_label: string;
  recordset_type_id: number;
  recordset_type_name: string;
  recordset_name: string;
  active: boolean;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type RecordsetResponse = {
  recordset?: Recordset;
  data?: Recordset;
  timestamp: string;
};

type RecordsetRelease = {
  recordset_release_id: number;
  recordset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  file_count: number;
};

type RecordsetReleasesResponse = {
  releases: RecordsetRelease[];
  total: number;
  timestamp: string;
};

type RecordsetDraft = {
  recordset_draft_id: number;
  recordset_id: number;
  cloned_from_release_id: number | null;
  draft_name: string;
  draft_status: string;
  draft_notes: string;
  file_count: number;
};

type RecordsetDraftsResponse = {
  drafts: RecordsetDraft[];
  total: number;
  timestamp: string;
};

function normalizeRecordsetReleasesResponse(
  payload: unknown,
): RecordsetReleasesResponse {
  const source = payload as
    | {
        releases?: RecordsetRelease[];
        total?: number;
        timestamp?: string;
        data?: RecordsetRelease[];
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

function normalizeRecordsetDraftsResponse(
  payload: unknown,
): RecordsetDraftsResponse {
  const source = payload as
    | {
        drafts?: RecordsetDraft[];
        total?: number;
        timestamp?: string;
        data?: RecordsetDraft[];
        meta?: { count?: number };
      }
    | undefined;

  const drafts = Array.isArray(source?.drafts)
    ? source.drafts
    : Array.isArray(source?.data)
      ? source.data
      : [];

  return {
    drafts,
    total:
      typeof source?.total === "number"
        ? source.total
        : typeof source?.meta?.count === "number"
          ? source.meta.count
          : drafts.length,
    timestamp:
      typeof source?.timestamp === "string"
        ? source.timestamp
        : new Date().toISOString(),
  };
}

type PageProps = {
  params: Promise<{
    recordset_id: string;
  }>;
};

export default function RecordsetByIdPage({ params }: PageProps) {
  const router = useRouter();
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsItemsPerPage, setDraftsItemsPerPage] = useState(4);
  const [releasesPage, setReleasesPage] = useState(1);
  const [releasesItemsPerPage, setReleasesItemsPerPage] = useState(6);
  const [releasesData, setReleasesData] =
    useState<RecordsetReleasesResponse | null>(null);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [draftsData, setDraftsData] = useState<RecordsetDraftsResponse | null>(
    null,
  );
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRecordset() {
      setIsLoading(true);
      setError(null);
      setIsLoadingReleases(true);
      setReleasesError(null);
      setIsLoadingDrafts(true);
      setDraftsError(null);

      const { recordset_id } = await params;
      const id = recordset_id;
      if (!isMounted) {
        return;
      }

      if (!id) {
        setError("Could not load recordset id.");
        setData(null);
        setIsLoading(false);
        setReleasesData(null);
        setDraftsData(null);
        setIsLoadingReleases(false);
        setIsLoadingDrafts(false);
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

        const releasesQuery = new URLSearchParams({
          page: String(releasesPage),
          limit: String(releasesItemsPerPage),
        }).toString();
        const releasesResponse = await fetch(
          `/api/recordsets/${id}/releases?${releasesQuery}`,
          {
            cache: "no-store",
          },
        );

        if (!releasesResponse.ok) {
          throw new Error(`Could not load releases for recordset ${id}.`);
        }

        const releasesJson = (await releasesResponse.json()) as unknown;

        if (!isMounted) {
          return;
        }

        setReleasesData(normalizeRecordsetReleasesResponse(releasesJson));

        const draftsQuery = new URLSearchParams({
          page: String(draftsPage),
          limit: String(draftsItemsPerPage),
        }).toString();
        const draftsResponse = await fetch(
          `/api/recordsets/${id}/drafts?${draftsQuery}`,
          {
            cache: "no-store",
          },
        );

        if (!draftsResponse.ok) {
          throw new Error(`Could not load drafts for recordset ${id}.`);
        }

        const draftsJson = (await draftsResponse.json()) as unknown;

        if (!isMounted) {
          return;
        }

        setDraftsData(normalizeRecordsetDraftsResponse(draftsJson));
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
          caughtError.message.includes("drafts")
        ) {
          setDraftsData(null);
          setDraftsError(caughtError.message);
        } else {
          if (caughtError instanceof Error) {
            setError(caughtError.message);
          } else {
            setError(`Could not load recordset ${id}.`);
          }

          setData(null);
          setReleasesData(null);
          setDraftsData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingReleases(false);
          setIsLoadingDrafts(false);
        }
      }
    }

    void loadRecordset();

    return () => {
      isMounted = false;
    };
  }, [
    params,
    draftsPage,
    draftsItemsPerPage,
    releasesPage,
    releasesItemsPerPage,
  ]);

  const recordset = data?.recordset ?? data?.data ?? null;
  const recordsetFields: DynamicSectionField[] = recordset
    ? [
        { label: "Recordset ID", value: recordset.recordset_id },
        { label: "DOI", value: recordset.recordset_doi },
        { label: "Dataset", value: recordset.dataset_name },
        { label: "License", value: recordset.license_label },
        { label: "Type", value: recordset.recordset_type_name },
        { label: "Active", value: recordset.active ? "Yes" : "No" },
        { label: "Name", value: recordset.recordset_name, fullWidth: true },
        { label: "Created By", value: recordset.who_created },
        {
          label: "Created At",
          value: new Date(recordset.when_created).toLocaleString(),
        },
        { label: "Updated By", value: recordset.who_updated },
        {
          label: "Updated At",
          value: new Date(recordset.when_updated).toLocaleString(),
        },
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <div className="border-b-2 border-black pb-4 dark:border-white">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Recordset Details
          </h1>
          <div className="flex gap-3">
            <Link
              href={
                recordsetId ? `/recordsets/${recordsetId}/edit` : "/recordsets"
              }
              className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Edit Recordset
            </Link>

            <Link
              href="/recordsets"
              className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Back to Recordsets
            </Link>
          </div>
        </div>
      </div>

      <DynamicSection
        isLoading={isLoading}
        error={error}
        fields={recordsetFields}
        actions={
          <></>
        }
      >
        {!isLoading && recordset && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
              <div className="flex items-center justify-between border-b-2 border-black pb-2 dark:border-white">
                <h2 className="text-lg font-semibold tracking-tight">Drafts</h2>
                <Link
                  href={
                    recordsetId
                      ? `/recordsets/drafts/create?recordset_id=${recordsetId}`
                      : "/recordsets/drafts/create"
                  }
                  className="inline-flex rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  New Draft
                </Link>
              </div>

              {isLoadingDrafts && (
                <p className="mt-3 text-sm">Loading drafts...</p>
              )}

              {!isLoadingDrafts && draftsError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {draftsError}
                </p>
              )}

              {!isLoadingDrafts && !draftsError && draftsData && (
                <div className="mt-3 space-y-3">
                  {/* <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Total drafts:{" "}
                    <span className="font-medium">{draftsData.total}</span>
                  </p> */}

                  <DynamicTable
                    rows={draftsData.drafts}
                    defaultItemsPerPage={4}
                    totalItems={draftsData.total}
                    currentPage={draftsPage}
                    currentItemsPerPage={draftsItemsPerPage}
                    paginateRows={false}
                    onPageChange={setDraftsPage}
                    onItemsPerPageChange={(nextItemsPerPage) => {
                      setDraftsItemsPerPage(nextItemsPerPage);
                      setDraftsPage(1);
                    }}
                    columns={[
                      { key: "recordset_draft_id", label: "ID" },
                      { key: "draft_name", label: "Name" },
                      { key: "draft_status", label: "Status" },
                      { key: "draft_notes", label: "Notes" },
                      { key: "file_count", label: "File Count" },
                      {
                        key: "cloned_from_release_id",
                        label: "Cloned Release ID",
                      },
                    ]}
                    onRowClick={(row) =>
                      router.push(`/recordsets/drafts/${row.recordset_draft_id}`)
                    }
                    getRowKey={(row) => row.recordset_draft_id}
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
              <div className="flex items-center justify-between border-b-2 border-black pb-2 dark:border-white">
                <h2 className="text-lg font-semibold tracking-tight">Releases</h2>
              </div>

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
                    defaultItemsPerPage={6}
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
                      { key: "recordset_release_id", label: "ID" },
                      { key: "release_number", label: "Version" },
                      { key: "release_date", label: "Date" },
                      { key: "release_notes", label: "Notes" },
                      { key: "file_count", label: "File Count" },
                    ]}
                    formatters={{
                      release_date: (value) =>
                        new Date(String(value)).toLocaleDateString(),
                    }}
                    onRowClick={(row) =>
                      router.push(
                        `/recordsets/releases/${row.recordset_release_id}`,
                      )
                    }
                    getRowKey={(row) => row.recordset_release_id}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </DynamicSection>
    </main>
  );
}
