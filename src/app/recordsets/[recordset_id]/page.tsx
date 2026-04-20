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
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        const releasesResponse = await fetch(`/api/recordsets/${id}/releases`, {
          cache: "no-store",
        });

        if (!releasesResponse.ok) {
          throw new Error(`Could not load releases for recordset ${id}.`);
        }

        const releasesJson = (await releasesResponse.json()) as unknown;

        if (!isMounted) {
          return;
        }

        setReleasesData(normalizeRecordsetReleasesResponse(releasesJson));

        const draftsResponse = await fetch(`/api/recordsets/${id}/drafts`, {
          cache: "no-store",
        });

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
  }, [params]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
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

        {!isLoading &&
          data &&
          (data.recordset ?? data.data) &&
          (() => {
            const recordset = data.recordset ?? data.data;

            return (
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium">Recordset ID</dt>
                  <dd>{recordset.recordset_id}</dd>
                </div>
                <div>
                  <dt className="font-medium">DOI</dt>
                  <dd>{recordset.recordset_doi}</dd>
                </div>
                <div>
                  <dt className="font-medium">Dataset ID</dt>
                  <dd>{recordset.dataset_id}</dd>
                </div>
                <div>
                  <dt className="font-medium">License ID</dt>
                  <dd>{recordset.license_id}</dd>
                </div>
                <div>
                  <dt className="font-medium">Type</dt>
                  <dd>{recordset.recordset_type}</dd>
                </div>
                <div>
                  <dt className="font-medium">Active</dt>
                  <dd>{recordset.active ? "Yes" : "No"}</dd>
                </div>
                <div className="col-span-full">
                  <dt className="font-medium">Title</dt>
                  <dd>{recordset.recordset_title}</dd>
                </div>
                <div>
                  <dt className="font-medium">Created By</dt>
                  <dd>{recordset.who_created}</dd>
                </div>
                <div>
                  <dt className="font-medium">Created At</dt>
                  <dd>{new Date(recordset.when_created).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium">Updated By</dt>
                  <dd>{recordset.who_updated}</dd>
                </div>
                <div>
                  <dt className="font-medium">Updated At</dt>
                  <dd>{new Date(recordset.when_updated).toLocaleString()}</dd>
                </div>
              </dl>
            );
          })()}

        <div className="mt-4 flex gap-3">
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
            className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Back to Recordsets
          </Link>
        </div>

        {!isLoading && (data?.recordset ?? data?.data) && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
              <h2 className="border-b-2 border-black pb-2 text-lg font-semibold tracking-tight dark:border-white">
                Drafts
              </h2>

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
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Total drafts:{" "}
                    <span className="font-medium">{draftsData.total}</span>
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/15">
                          <th className="px-2 py-2 font-medium">ID</th>
                          <th className="px-2 py-2 font-medium">Name</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                          <th className="px-2 py-2 font-medium">Notes</th>
                          <th className="px-2 py-2 font-medium">File Count</th>
                          <th className="px-2 py-2 font-medium">
                            Cloned Release ID
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftsData.drafts.map((draft) => (
                          <tr
                            key={draft.recordset_draft_id}
                            className="border-b border-black/5 dark:border-white/10"
                          >
                            <td className="px-2 py-2">
                              {draft.recordset_draft_id}
                            </td>
                            <td className="px-2 py-2">{draft.draft_name}</td>
                            <td className="px-2 py-2">{draft.draft_status}</td>
                            <td className="px-2 py-2">{draft.draft_notes}</td>
                            <td className="px-2 py-2">{draft.file_count}</td>
                            <td className="px-2 py-2">
                              {draft.cloned_from_release_id ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Total releases:{" "}
                    <span className="font-medium">{releasesData.total}</span>
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-black/10 dark:border-white/15">
                          <th className="px-2 py-2 font-medium">ID</th>
                          <th className="px-2 py-2 font-medium">Version</th>
                          <th className="px-2 py-2 font-medium">Date</th>
                          <th className="px-2 py-2 font-medium">Notes</th>
                          <th className="px-2 py-2 font-medium">File Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {releasesData.releases.map((release) => (
                          <tr
                            key={release.recordset_release_id}
                            className="border-b border-black/5 dark:border-white/10"
                          >
                            <td className="px-2 py-2">
                              {release.recordset_release_id}
                            </td>
                            <td className="px-2 py-2">
                              {release.release_number}
                            </td>
                            <td className="px-2 py-2">
                              {new Date(
                                release.release_date,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-2">
                              {release.release_notes}
                            </td>
                            <td className="px-2 py-2">{release.file_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
