"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";
import DynamicTable from "@/components/DynamicTable";
import { Button, LinkButton } from "@/components/ui/Button";
import { CardHeader, CardTitle } from "@/components/ui/Card";
import { PageDetailHeader, PageShell } from "@/components/ui/Page";
import { useToast } from "@/components/Toast";
import { toastError, toastSuccess } from "@/components/toastHelpers";

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

type RecordsetDestination = {
  destination_id: number;
  destination_name: string;
  destination_abbr: string;
  default_display: boolean;
  transfer_mode_id: number;
  transfer_mode_name: string;
};

type DestinationLookup = {
  destination_id: number;
  destination_name: string;
  destination_abbr: string;
};

type TransferModeLookup = {
  transfer_mode_id: number;
  transfer_mode_name: string;
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
  const { addToast } = useToast();
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsItemsPerPage, setDraftsItemsPerPage] = useState(4);
  const [releasesPage, setReleasesPage] = useState(1);
  const [releasesItemsPerPage, setReleasesItemsPerPage] = useState(4);
  const [destinationsPage, setDestinationsPage] = useState(1);
  const [destinationsItemsPerPage, setDestinationsItemsPerPage] = useState(4);
  const [releasesData, setReleasesData] =
    useState<RecordsetReleasesResponse | null>(null);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);
  const [draftsData, setDraftsData] = useState<RecordsetDraftsResponse | null>(
    null,
  );
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);

  // Destinations
  const [destinations, setDestinations] = useState<RecordsetDestination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
  const [allDestinations, setAllDestinations] = useState<DestinationLookup[]>([]);
  const [transferModes, setTransferModes] = useState<TransferModeLookup[]>([]);

  // Destination modal
  const [showDestModal, setShowDestModal] = useState(false);
  const [destModalIsAdding, setDestModalIsAdding] = useState(true);
  const [destModalDestId, setDestModalDestId] = useState<number | null>(null);
  const [destModalDefaultDisplay, setDestModalDefaultDisplay] = useState(false);
  const [destModalTransferModeId, setDestModalTransferModeId] = useState<number | null>(null);
  const [isSavingDest, setIsSavingDest] = useState(false);
  const [destModalError, setDestModalError] = useState<string | null>(null);

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

  // Load destinations + lookup data whenever recordsetId is resolved
  useEffect(() => {
    if (!recordsetId) return;
    let isMounted = true;

    setIsLoadingDestinations(true);
    setDestinationsError(null);

    async function loadDestinationsAndLookups() {
      try {
        const [destRes, allDestRes, modesRes] = await Promise.all([
          fetch(`/api/recordsets/${recordsetId}/destinations`, { cache: "no-store" }),
          fetch("/api/lookups/destinations", { cache: "no-store" }),
          fetch("/api/lookups/transfer-modes", { cache: "no-store" }),
        ]);

        if (!isMounted) return;

        if (destRes.ok) {
          const json = (await destRes.json()) as { data?: RecordsetDestination[] } | RecordsetDestination[];
          setDestinations(Array.isArray(json) ? json : (json.data ?? []));
        } else {
          setDestinationsError("Could not load destinations.");
        }

        if (allDestRes.ok) {
          const json = (await allDestRes.json()) as { data?: DestinationLookup[] } | DestinationLookup[];
          setAllDestinations(Array.isArray(json) ? json : (json.data ?? []));
        }

        if (modesRes.ok) {
          const json = (await modesRes.json()) as { data?: TransferModeLookup[] } | TransferModeLookup[];
          setTransferModes(Array.isArray(json) ? json : (json.data ?? []));
        }
      } catch {
        if (isMounted) setDestinationsError("Could not load destinations.");
      } finally {
        if (isMounted) setIsLoadingDestinations(false);
      }
    }

    void loadDestinationsAndLookups();
    return () => { isMounted = false; };
  }, [recordsetId]);

  function openAddDestModal() {
    setDestModalIsAdding(true);
    setDestModalDestId(null);
    setDestModalDefaultDisplay(false);
    setDestModalTransferModeId(transferModes[0]?.transfer_mode_id ?? null);
    setDestModalError(null);
    setShowDestModal(true);
  }

  function openEditDestModal(dest: RecordsetDestination) {
    setDestModalIsAdding(false);
    setDestModalDestId(dest.destination_id);
    setDestModalDefaultDisplay(dest.default_display);
    setDestModalTransferModeId(dest.transfer_mode_id);
    setDestModalError(null);
    setShowDestModal(true);
  }

  function closeDestModal() {
    setShowDestModal(false);
    setDestModalError(null);
  }

  async function handleSaveDestination() {
    if (!recordsetId || !destModalDestId || !destModalTransferModeId) return;

    setIsSavingDest(true);
    setDestModalError(null);

    try {
      const res = await fetch(
        `/api/recordsets/${recordsetId}/destinations/${destModalDestId}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            default_display: destModalDefaultDisplay,
            default_transfer_mode_id: destModalTransferModeId,
          }),
        },
      );

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Could not save destination.");
      }

      toastSuccess(addToast, destModalIsAdding ? "Destination added." : "Destination updated.");
      closeDestModal();

      // Refresh destinations list
      const destRes = await fetch(`/api/recordsets/${recordsetId}/destinations`, { cache: "no-store" });
      if (destRes.ok) {
        const json = (await destRes.json()) as { data?: RecordsetDestination[] } | RecordsetDestination[];
        setDestinations(Array.isArray(json) ? json : (json.data ?? []));
      }
    } catch (e) {
      setDestModalError(e instanceof Error ? e.message : "Could not save destination.");
      toastError(addToast, e instanceof Error ? e.message : "Could not save destination.");
    } finally {
      setIsSavingDest(false);
    }
  }

  const configuredDestIds = new Set(destinations.map((d) => d.destination_id));
  const availableDestinations = allDestinations.filter((d) => !configuredDestIds.has(d.destination_id));

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
      ]
    : [];

  return (
    <PageShell size="5xl">
      <PageDetailHeader
        title="Recordset Details"
        breadcrumb={{ label: "Recordsets", href: "/recordsets" }}
        subtitle={recordset?.recordset_name}
        badge={recordset ? { label: recordset.active ? "Active" : "Inactive", variant: recordset.active ? "success" : "neutral" } : undefined}
        actions={
          <LinkButton href={recordsetId ? `/recordsets/${recordsetId}/edit` : "/recordsets"}>
            Edit Recordset
          </LinkButton>
        }
      />

      <DynamicSection
        isLoading={isLoading}
        error={error}
        fields={recordsetFields}
        actions={
          <div className="space-y-1 rounded-md px-3 py-2 text-xs" style={{ background: "var(--surface-alt)", border: "1px solid var(--border-strong)", color: "var(--muted)" }}>
            <p><span className="font-semibold" style={{ color: "var(--foreground)" }}>Created:</span>{" "}{recordset ? new Date(recordset.when_created).toLocaleString() : "—"} by {recordset?.who_created}</p>
            <p><span className="font-semibold" style={{ color: "var(--foreground)" }}>Updated:</span>{" "}{recordset ? new Date(recordset.when_updated).toLocaleString() : "—"} by {recordset?.who_updated}</p>
          </div>
        }
      >
        {!isLoading && recordset && (
          <div className="mt-6 space-y-4">
            <div className="space-y-3">
              <CardHeader>
                <CardTitle>Destinations</CardTitle>
                <Button
                  size="sm"
                  onClick={openAddDestModal}
                  disabled={availableDestinations.length === 0}
                >
                  New Destination
                </Button>
              </CardHeader>

              {isLoadingDestinations && (
                <p className="mt-3 text-sm">Loading destinations...</p>
              )}

              {!isLoadingDestinations && destinationsError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {destinationsError}
                </p>
              )}

              {!isLoadingDestinations && !destinationsError && (
                <div className="rounded-lg border border-black/10 dark:border-white/5">
                  <DynamicTable
                    rows={destinations}
                    defaultItemsPerPage={4}
                    totalItems={destinations.length}
                    currentPage={destinationsPage}
                    currentItemsPerPage={destinationsItemsPerPage}
                    onPageChange={setDestinationsPage}
                    onItemsPerPageChange={(n) => { setDestinationsItemsPerPage(n); setDestinationsPage(1); }}
                    columns={[
                      { key: "destination_name", label: "Destination" },
                      { key: "destination_abbr", label: "Abbr" },
                      { key: "default_display", label: "Default Display" },
                      { key: "transfer_mode_name", label: "Transfer Mode" },
                    ]}
                    formatters={{
                      default_display: (value) => (value ? "Yes" : "No"),
                    }}
                    onRowClick={(row) => openEditDestModal(row)}
                    getRowKey={(row) => row.destination_id}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <CardHeader>
                <CardTitle>Releases</CardTitle>
              </CardHeader>

              {isLoadingReleases && (
                <p className="mt-3 text-sm">Loading releases...</p>
              )}

              {!isLoadingReleases && releasesError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {releasesError}
                </p>
              )}

              {!isLoadingReleases && !releasesError && releasesData && (
                <div className="rounded-lg border border-black/10 dark:border-white/5">
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

            <div className="space-y-3">
              <CardHeader>
                <CardTitle>Drafts</CardTitle>
                <LinkButton
                  href={
                    recordsetId
                      ? `/recordsets/drafts/create?recordset_id=${recordsetId}`
                      : "/recordsets/drafts/create"
                  }
                  size="sm"
                >
                  New Draft
                </LinkButton>
              </CardHeader>

              {isLoadingDrafts && (
                <p className="mt-3 text-sm">Loading drafts...</p>
              )}

              {!isLoadingDrafts && draftsError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {draftsError}
                </p>
              )}

              {!isLoadingDrafts && !draftsError && draftsData && (
                <div className="rounded-lg border border-black/10 dark:border-white/5">
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
                      router.push(
                        `/recordsets/drafts/${row.recordset_draft_id}`,
                      )
                    }
                    getRowKey={(row) => row.recordset_draft_id}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </DynamicSection>

      {showDestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">
              {destModalIsAdding ? "New Destination" : "Edit Destination"}
            </h2>

            {destModalError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{destModalError}</p>
            )}

            <div className="mt-4 space-y-4">
              {destModalIsAdding ? (
                <div>
                  <label className="block text-sm font-medium">Destination</label>
                  <select
                    value={destModalDestId ?? ""}
                    onChange={(e) => setDestModalDestId(Number(e.target.value))}
                    className="select mt-1 w-full"
                  >
                    <option value="">Select a destination...</option>
                    {availableDestinations.map((d) => (
                      <option key={d.destination_id} value={d.destination_id}>
                        {d.destination_name} ({d.destination_abbr})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <span className="block text-sm font-medium">Destination</span>
                  <span className="text-sm">
                    {destinations.find((d) => d.destination_id === destModalDestId)?.destination_name}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Transfer Mode</label>
                <select
                  value={destModalTransferModeId ?? ""}
                  onChange={(e) => setDestModalTransferModeId(Number(e.target.value))}
                  className="select mt-1 w-full"
                >
                  <option value="">Select a transfer mode...</option>
                  {transferModes.map((tm) => (
                    <option key={tm.transfer_mode_id} value={tm.transfer_mode_id}>
                      {tm.transfer_mode_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dest_default_display"
                  checked={destModalDefaultDisplay}
                  onChange={(e) => setDestModalDefaultDisplay(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="dest_default_display" className="text-sm font-medium">
                  Default Display
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeDestModal} disabled={isSavingDest}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSaveDestination()}
                disabled={isSavingDest || !destModalDestId || !destModalTransferModeId}
              >
                {isSavingDest ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
