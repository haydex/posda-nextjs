"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";

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

type PageProps = {
  params: Promise<{
    draft_id: string;
  }>;
};

export default function DraftByIdPage({ params }: PageProps) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [data, setData] = useState<DraftResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      setIsLoading(true);
      setError(null);

      const { draft_id } = await params;
      const id = draft_id;
      if (!isMounted) {
        return;
      }

      setDraftId(id);

      try {
        const response = await fetch(`/api/recordsets/drafts/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load draft ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as DraftResponse;

        if (!isMounted) {
          return;
        }

        setData({ ...json, draft: json.draft ?? json.data });
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(`Could not load draft ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <div className="border-b-2 border-black pb-4 dark:border-white">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Recordset Draft Details</h1>
          <div className="flex gap-3">
            <Link
              href={
                draftId
                  ? `/recordsets/drafts/${draftId}/edit`
                  : "/recordsets"
              }
              className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Edit Draft
            </Link>
            <Link
              href={
                draft?.recordset_id
                  ? `/recordsets/${draft.recordset_id}`
                  : "/recordsets"
              }
              className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Back to Recordset
            </Link>
          </div>
        </div>
      </div>

      <DynamicSection isLoading={isLoading} error={error} fields={draftFields} />
    </main>
  );
}
