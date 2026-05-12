"use client";

import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";
import { LinkButton } from "@/components/ui/Button";
import { CardHeader, CardTitle, SectionCard } from "@/components/ui/Card";
import { PageHeader, PageShell, PageTitle } from "@/components/ui/Page";

type Draft = {
  recordset_draft_id: number;
  recordset_id: number;
  cloned_from_release_id: number | null;
  draft_name: string;
  draft_status: string;
  draft_notes: string;
  when_created?: string;
  who_created?: string;
  when_updated?: string;
  who_updated?: string;
};

type DraftResponse = {
  draft?: Draft;
  data?: Draft;
  timestamp: string;
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
  params: Promise<{
    draft_id: string;
  }>;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DraftByIdPage({ params }: PageProps) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [data, setData] = useState<DraftResponse | null>(null);
  const [summary, setSummary] = useState<DraftSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      setIsLoading(true);
      setError(null);
      setSummaryError(null);

      const { draft_id } = await params;
      if (!isMounted) return;

      setDraftId(draft_id);

      try {
        const [draftRes, summaryRes] = await Promise.all([
          fetch(`/api/recordsets/drafts/${draft_id}`, { cache: "no-store" }),
          fetch(`/api/recordsets/drafts/${draft_id}/summary`, { cache: "no-store" }),
        ]);

        if (!isMounted) return;

        if (!draftRes.ok) {
          const fallbackMessage = `Could not load draft ${draft_id}.`;
          try {
            const json = (await draftRes.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await draftRes.json()) as DraftResponse;
        if (isMounted) setData({ ...json, draft: json.draft ?? json.data });

        if (summaryRes.ok) {
          const summaryJson = (await summaryRes.json()) as { data: DraftSummary };
          if (isMounted) setSummary(summaryJson.data);
        } else {
          if (isMounted) setSummaryError("Could not load file summary.");
        }
      } catch (caughtError) {
        if (!isMounted) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : `Could not load draft ${draft_id}.`,
        );
        setData(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadDraft();
    return () => {
      isMounted = false;
    };
  }, [params]);

  const draft = data?.draft ?? data?.data ?? null;

  const draftFields: DynamicSectionField[] = draft
    ? [
        { label: "Draft ID", value: draft.recordset_draft_id },
        { label: "Recordset ID", value: draft.recordset_id },
        { label: "Draft Name", value: draft.draft_name },
        { label: "Draft Status", value: draft.draft_status },
        {
          label: "Cloned From Release ID",
          value: draft.cloned_from_release_id ?? "N/A",
        },
        { label: "Created By", value: draft.who_created ?? "-" },
        {
          label: "Created At",
          value: draft.when_created
            ? new Date(draft.when_created).toLocaleString()
            : "-",
        },
        { label: "Updated By", value: draft.who_updated ?? "-" },
        {
          label: "Updated At",
          value: draft.when_updated
            ? new Date(draft.when_updated).toLocaleString()
            : "-",
        },
        ...(draft.draft_notes
          ? [
              {
                label: "Notes",
                value: draft.draft_notes,
                fullWidth: true,
                valueClassName: "mt-1 whitespace-pre-wrap text-xs",
              },
            ]
          : []),
      ]
    : [];

  const hasDicom = (summary?.dicom.series_count ?? 0) > 0;

  return (
    <PageShell size="5xl">
      <PageHeader>
        <div className="flex items-center justify-between gap-4">
          <PageTitle>Recordset Draft Details</PageTitle>
          <div className="flex gap-3">
            <LinkButton
              href={
                draftId ? `/recordsets/drafts/${draftId}/edit` : "/recordsets"
              }
            >
              Edit Draft
            </LinkButton>
            <LinkButton
              href={
                draft?.recordset_id
                  ? `/recordsets/${draft.recordset_id}`
                  : "/recordsets"
              }
              variant="ghost"
            >
              Back to Recordset
            </LinkButton>
          </div>
        </div>
      </PageHeader>

      <DynamicSection isLoading={isLoading} error={error} fields={draftFields} />

      <SectionCard>
        <CardHeader>
          <CardTitle>File Summary</CardTitle>
          <LinkButton
            href={draftId ? `/recordsets/drafts/${draftId}/files` : "#"}
            size="sm"
          >
            Edit Files
          </LinkButton>
        </CardHeader>

        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && summaryError && (
          <p className="text-sm text-red-600 dark:text-red-300">{summaryError}</p>
        )}

        {!isLoading && !summaryError && summary && (
          <div className="mt-3 divide-y divide-neutral-300 text-sm dark:divide-neutral-600">
            <div className="flex gap-8 pb-4">
              <div>
                <span className="text-neutral-600 dark:text-neutral-300">Total Files </span>
                <span className="font-semibold">{summary.total_files.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-neutral-300">Total Size </span>
                <span className="font-semibold">{formatBytes(summary.total_size_bytes)}</span>
              </div>
            </div>

            {summary.by_file_type.length > 0 && (
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
                    {summary.by_file_type.map((ft) => (
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
                      <td className="py-1 pr-10">{summary.dicom.patient_count.toLocaleString()}</td>
                      <td className="py-1 pr-10">{summary.dicom.study_count.toLocaleString()}</td>
                      <td className="py-1">{summary.dicom.series_count.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {summary.dicom.by_modality.length > 0 && (
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
                        {summary.dicom.by_modality.map((m) => (
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
    </PageShell>
  );
}
