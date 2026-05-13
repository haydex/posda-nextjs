"use client";

import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { CardHeader, CardTitle, SectionCard } from "@/components/ui/Card";
import { PageHeader, PageShell, PageTitle } from "@/components/ui/Page";
import { useToast } from "@/components/Toast";
import { toastError, toastSuccess } from "@/components/toastHelpers";

type Draft = {
  recordset_draft_id: number;
  draft_name: string;
  draft_status: string;
  recordset_id: number;
};

type Activity = {
  activity_id: number;
  brief_description: string;
  who_created: string;
  when_created: string;
};

type Timepoint = {
  activity_timepoint_id: number;
  when_created: string;
  comment: string | null;
  creating_user: string | null;
  file_count: number;
};

type DiffResult = {
  draft_id: number;
  compare_type: string;
  compare_id: number;
  compare_timepoint_id: number | null;
  added_file_ids: number[];   // in draft, NOT in activity
  removed_file_ids: number[]; // in activity, NOT in draft
  added_count: number;
  removed_count: number;
  unchanged_count: number;
};

type FileTypeSummary = {
  file_type: string;
  file_count: number;
  total_size_bytes: number;
};

type ModalitySummary = {
  modality: string;
  series_count: number;
  file_count: number;
};

type DraftSummary = {
  draft_id: number;
  total_files: number;
  total_size_bytes: number;
  by_file_type: FileTypeSummary[];
  dicom: {
    patient_count: number;
    study_count: number;
    series_count: number;
    by_modality: ModalitySummary[];
  };
};

type PageProps = {
  params: Promise<{ draft_id: string }>;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DraftFilesPage({ params }: PageProps) {
  const { addToast } = useToast();

  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [browserTab, setBrowserTab] = useState<"activity" | "release" | "files">("activity");

  // Activity browser
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityIdSearch, setActivityIdSearch] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [timepoints, setTimepoints] = useState<Timepoint[]>([]);
  const [selectedTimepointId, setSelectedTimepointId] = useState<number | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [diffRefreshKey, setDiffRefreshKey] = useState(0);

  // Draft contents
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

  // Loading states
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingTimepoints, setIsLoadingTimepoints] = useState(false);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Error states
  const [draftError, setDraftError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [timepointsError, setTimepointsError] = useState<string | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Load draft + activities on mount
  useEffect(() => {
    let isMounted = true;

    async function load() {
      const { draft_id } = await params;
      if (!isMounted) return;
      setDraftId(draft_id);
      setIsLoadingDraft(true);
      setIsLoadingActivities(true);

      try {
        const [draftRes, activitiesRes] = await Promise.all([
          fetch(`/api/recordsets/drafts/${draft_id}`, { cache: "no-store" }),
          fetch("/api/activities", { cache: "no-store" }),
        ]);

        if (!isMounted) return;

        if (draftRes.ok) {
          const json = (await draftRes.json()) as { data?: Draft; draft?: Draft };
          setDraft(json.data ?? json.draft ?? null);
        } else {
          setDraftError(`Could not load draft ${draft_id}.`);
        }

        if (activitiesRes.ok) {
          const json = (await activitiesRes.json()) as Activity[] | { data?: Activity[] };
          setActivities(Array.isArray(json) ? json : (json.data ?? []));
        } else {
          setActivitiesError("Could not load activities.");
        }
      } catch {
        if (!isMounted) return;
        setDraftError("Could not load page data.");
      } finally {
        if (isMounted) {
          setIsLoadingDraft(false);
          setIsLoadingActivities(false);
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [params]);

  // Load draft summary when Draft Contents tab is active
  useEffect(() => {
    if (!draftId) return;
    let isMounted = true;

    setIsLoadingSummary(true);
    setSummaryError(null);

    async function loadSummary() {
      try {
        const res = await fetch(`/api/recordsets/drafts/${draftId}/summary`, {
          cache: "no-store",
        });
        if (!isMounted) return;
        if (res.ok) {
          const json = (await res.json()) as { data: DraftSummary };
          setDraftSummary(json.data);
        } else {
          setSummaryError("Could not load draft summary.");
        }
      } catch {
        if (!isMounted) return;
        setSummaryError("Could not load draft summary.");
      } finally {
        if (isMounted) setIsLoadingSummary(false);
      }
    }

    void loadSummary();
    return () => {
      isMounted = false;
    };
  }, [draftId, summaryRefreshKey]);

  // Load timepoints when an activity is selected
  useEffect(() => {
    if (!selectedActivityId) {
      setTimepoints([]);
      setSelectedTimepointId(null);
      setDiff(null);
      return;
    }

    let isMounted = true;
    setIsLoadingTimepoints(true);
    setTimepointsError(null);
    setTimepoints([]);
    setSelectedTimepointId(null);
    setDiff(null);

    async function loadTimepoints() {
      try {
        const res = await fetch(
          `/api/activities/${selectedActivityId}/timepoints`,
          { cache: "no-store" },
        );
        if (!isMounted) return;
        if (res.ok) {
          const json = (await res.json()) as Timepoint[] | { data?: Timepoint[] };
          const list = Array.isArray(json) ? json : (json.data ?? []);
          setTimepoints(list);
          if (list.length > 0) {
            setSelectedTimepointId(list[0].activity_timepoint_id);
          }
        } else {
          setTimepointsError("Could not load timepoints.");
        }
      } catch {
        if (!isMounted) return;
        setTimepointsError("Could not load timepoints.");
      } finally {
        if (isMounted) setIsLoadingTimepoints(false);
      }
    }

    void loadTimepoints();
    return () => {
      isMounted = false;
    };
  }, [selectedActivityId]);

  // Load diff when activity + timepoint are ready
  useEffect(() => {
    if (!draftId || !selectedActivityId || !selectedTimepointId) {
      setDiff(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDiff(true);
    setDiffError(null);
    setDiff(null);

    const activityId = selectedActivityId;
    const timepointId = selectedTimepointId;

    async function loadDiff() {
      const query = new URLSearchParams({
        compare_activity_id: String(activityId),
        compare_timepoint_id: String(timepointId),
      });
      try {
        const res = await fetch(
          `/api/recordsets/drafts/${draftId}/diff?${query.toString()}`,
          { cache: "no-store" },
        );
        if (!isMounted) return;
        if (res.ok) {
          const json = (await res.json()) as { data: DiffResult } | DiffResult;
          setDiff("data" in json ? (json as { data: DiffResult }).data : (json as DiffResult));
        } else {
          setDiffError("Could not load diff.");
        }
      } catch {
        if (!isMounted) return;
        setDiffError("Could not load diff.");
      } finally {
        if (isMounted) setIsLoadingDiff(false);
      }
    }

    void loadDiff();
    return () => {
      isMounted = false;
    };
  }, [draftId, selectedActivityId, selectedTimepointId, diffRefreshKey]);

  async function handleAddFromActivity() {
    if (!draftId || !diff || diff.removed_file_ids.length === 0) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/recordsets/drafts/${draftId}/files/add`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ file_ids: diff.removed_file_ids }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Could not add files.");
      }

      toastSuccess(
        addToast,
        `Added ${diff.removed_file_ids.length.toLocaleString()} files to draft.`,
      );
      setDiffRefreshKey((k) => k + 1);
      setSummaryRefreshKey((k) => k + 1);
    } catch (e) {
      toastError(addToast, e instanceof Error ? e.message : "Could not add files.");
    } finally {
      setIsAdding(false);
    }
  }

  const DISPLAY_CAP = 25;
  const trimmedSearch = activitySearch.trim();
  const trimmedIdSearch = activityIdSearch.trim();
  const textSearchActive = trimmedSearch.length >= 2;
  const idSearchActive = /^\d+$/.test(trimmedIdSearch);
  const searchActive = textSearchActive || idSearchActive;
  const searchedId = idSearchActive ? Number(trimmedIdSearch) : null;

  const matchedActivities = searchActive
    ? activities.filter(
        (a) =>
          (idSearchActive && a.activity_id === searchedId) ||
          (textSearchActive &&
            ((a.brief_description ?? "").toLowerCase().includes(trimmedSearch.toLowerCase()) ||
              (a.who_created ?? "").toLowerCase().includes(trimmedSearch.toLowerCase()))),
      )
    : [];

  const hasMoreResults = matchedActivities.length > DISPLAY_CAP;
  const displayedActivities = hasMoreResults
    ? matchedActivities.slice(0, DISPLAY_CAP)
    : matchedActivities;

  const hasDicom = (draftSummary?.dicom.series_count ?? 0) > 0;

  return (
    <PageShell size="5xl">
      <PageHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <PageTitle>Edit Draft Files</PageTitle>
            {!isLoadingDraft && draft && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {draft.draft_name}
              </p>
            )}
          </div>
          <LinkButton
            href={draftId ? `/recordsets/drafts/${draftId}` : "/recordsets"}
            variant="ghost"
          >
            Back to Draft
          </LinkButton>
        </div>
      </PageHeader>

      {draftError && (
        <p className="text-sm text-red-600 dark:text-red-400">{draftError}</p>
      )}

      <div className="grid grid-cols-[2fr_3fr] items-start gap-6">
        {/* Left: Draft Contents (always visible) */}
        <SectionCard>
          <CardHeader>
            <CardTitle>Draft Contents</CardTitle>
          </CardHeader>

          {isLoadingSummary && <p className="mt-3 text-sm">Loading...</p>}

          {!isLoadingSummary && summaryError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {summaryError}
            </p>
          )}

          {!isLoadingSummary && !summaryError && draftSummary && (
            <div className="mt-3 divide-y divide-neutral-300 text-sm dark:divide-neutral-600">
              <div className="flex gap-8 pb-4">
                <div>
                  <span className="text-neutral-600 dark:text-neutral-300">Total Files </span>
                  <span className="font-semibold">
                    {draftSummary.total_files.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-600 dark:text-neutral-300">Total Size </span>
                  <span className="font-semibold">
                    {formatBytes(draftSummary.total_size_bytes)}
                  </span>
                </div>
              </div>

              {draftSummary.by_file_type.length > 0 && (
                <div className="py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    By File Type
                  </p>
                  <table>
                    <thead>
                      <tr className="text-left text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                        <th className="pb-1 pr-10">Type</th>
                        <th className="pb-1 pr-10">Files</th>
                        <th className="pb-1">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftSummary.by_file_type.map((ft) => (
                        <tr key={ft.file_type}>
                          <td className="py-1 pr-10">{ft.file_type}</td>
                          <td className="py-1 pr-10">{ft.file_count.toLocaleString()}</td>
                          <td className="py-1">{formatBytes(ft.total_size_bytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {hasDicom && (
                <div className="py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                    DICOM Hierarchy
                  </p>
                  <table>
                    <thead>
                      <tr className="text-left text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                        <th className="pb-1 pr-10">Patients</th>
                        <th className="pb-1 pr-10">Studies</th>
                        <th className="pb-1">Series</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1 pr-10">
                          {draftSummary.dicom.patient_count.toLocaleString()}
                        </td>
                        <td className="py-1 pr-10">
                          {draftSummary.dicom.study_count.toLocaleString()}
                        </td>
                        <td className="py-1">
                          {draftSummary.dicom.series_count.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {draftSummary.dicom.by_modality.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                        By Modality
                      </p>
                      <table>
                        <thead>
                          <tr className="text-left text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                            <th className="pb-1 pr-10">Modality</th>
                            <th className="pb-1 pr-10">Series</th>
                            <th className="pb-1">Files</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draftSummary.dicom.by_modality.map((m) => (
                            <tr key={m.modality}>
                              <td className="py-1 pr-10">{m.modality}</td>
                              <td className="py-1 pr-10">{m.series_count.toLocaleString()}</td>
                              <td className="py-1">{m.file_count.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Right: Browser panel with tabs */}
        <div className="space-y-4">
          <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
            {(["activity", "release", "files"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setBrowserTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  browserTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                {tab === "activity"
                  ? "Activity Browser"
                  : tab === "release"
                  ? "Release Browser"
                  : "File Browser"}
              </button>
            ))}
          </div>

          {/* Activity Browser */}
          {browserTab === "activity" && (
            <div className="space-y-4">
              <SectionCard>
                <CardHeader>
                  <CardTitle>Activities</CardTitle>
                </CardHeader>

                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    placeholder="ID"
                    value={activityIdSearch}
                    onChange={(e) => setActivityIdSearch(e.target.value)}
                    className="input w-24"
                  />
                  <input
                    type="text"
                    placeholder="Search by description or creator..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="input flex-1"
                  />
                </div>

                {isLoadingActivities && (
                  <p className="mt-3 text-sm">Loading activities...</p>
                )}

                {!isLoadingActivities && activitiesError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {activitiesError}
                  </p>
                )}

                {!isLoadingActivities && !activitiesError && (
                  <div className="mt-3 rounded-md border border-neutral-200 dark:border-neutral-700">
                    {!searchActive ? (
                      <p className="p-3 text-sm text-neutral-500">
                        Enter an activity ID or type 2+ characters to search.
                      </p>
                    ) : displayedActivities.length === 0 ? (
                      <p className="p-3 text-sm text-neutral-500">No activities found.</p>
                    ) : (
                      <>
                        <ul className="max-h-72 divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
                          {displayedActivities.map((a) => (
                            <li key={a.activity_id}>
                              <button
                                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                                  selectedActivityId === a.activity_id
                                    ? "bg-blue-50 dark:bg-blue-950/30"
                                    : ""
                                }`}
                                onClick={() => {
                                  setSelectedActivityId(a.activity_id);
                                  setSelectedActivity(a);
                                }}
                              >
                                <span className="font-medium">{a.brief_description}</span>
                                <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                                  #{a.activity_id} &middot; {a.who_created} &middot;{" "}
                                  {new Date(a.when_created).toLocaleDateString()}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                        {hasMoreResults && (
                          <p className="border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                            Showing {DISPLAY_CAP} of {matchedActivities.length} — refine your search to narrow results.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </SectionCard>

              {selectedActivity && (
                <SectionCard>
                  <CardHeader>
                    <CardTitle>{selectedActivity.brief_description}</CardTitle>
                  </CardHeader>

                  <div className="mt-3">
                    {isLoadingTimepoints && (
                      <p className="text-sm">Loading timepoints...</p>
                    )}
                    {!isLoadingTimepoints && timepointsError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{timepointsError}</p>
                    )}
                    {!isLoadingTimepoints && !timepointsError && timepoints.length === 0 && (
                      <p className="text-sm text-neutral-500">
                        No timepoints found for this activity.
                      </p>
                    )}
                    {!isLoadingTimepoints && !timepointsError && timepoints.length > 0 && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Timepoint
                        </label>
                        <select
                          value={selectedTimepointId ?? ""}
                          onChange={(e) => setSelectedTimepointId(Number(e.target.value))}
                          className="select"
                        >
                          {timepoints.map((tp, idx) => (
                            <option key={tp.activity_timepoint_id} value={tp.activity_timepoint_id}>
                              {new Date(tp.when_created).toLocaleString()}
                              {idx === 0 ? " (latest)" : ""}
                              {tp.comment ? ` — ${tp.comment}` : ""}
                              {` · ${tp.file_count.toLocaleString()} files`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {isLoadingDiff && <p className="mt-4 text-sm">Loading diff...</p>}

                  {!isLoadingDiff && diffError && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{diffError}</p>
                  )}

                  {!isLoadingDiff && !diffError && diff && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-700">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {diff.removed_count.toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            From activity, not in draft
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                            {diff.unchanged_count.toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            Already in draft
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {diff.added_count.toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                            In draft, not from this activity
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => void handleAddFromActivity()}
                          disabled={isAdding || diff.removed_count === 0}
                          size="sm"
                        >
                          {isAdding
                            ? "Adding..."
                            : `Add ${diff.removed_count.toLocaleString()} Files to Draft`}
                        </Button>
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            </div>
          )}

          {/* Release Browser */}
          {browserTab === "release" && (
            <SectionCard>
              <CardHeader>
                <CardTitle>Release Browser</CardTitle>
              </CardHeader>
              <p className="mt-3 text-sm text-neutral-500">Coming soon.</p>
            </SectionCard>
          )}

          {/* File Browser */}
          {browserTab === "files" && (
            <SectionCard>
              <CardHeader>
                <CardTitle>File Browser</CardTitle>
              </CardHeader>
              <p className="mt-3 text-sm text-neutral-500">Coming soon.</p>
            </SectionCard>
          )}
        </div>
      </div>
    </PageShell>
  );
}
