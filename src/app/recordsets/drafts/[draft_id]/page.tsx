"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";

type Draft = {
  dataset_release_draft_id: number;
  dataset_id: number;
  cloned_from_release_id: number | null;
  draft_name: string;
  draft_status: string;
  draft_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type DraftResponse = {
  draft: Draft;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
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

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setDraftId(id);

      try {
        const response = await fetch(`/api/drafts/${id}`, {
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

        setData(json);
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

  const draft = data?.draft ?? null;
  const draftFields: DynamicSectionField[] = draft
    ? [
        { label: "Draft ID", value: draft.dataset_release_draft_id },
        { label: "Dataset ID", value: draft.dataset_id },
        { label: "Draft Name", value: draft.draft_name },
        { label: "Draft Status", value: draft.draft_status },
        {
          label: "Cloned From Release ID",
          value: draft.cloned_from_release_id ?? "N/A",
        },
        { label: "Created By", value: draft.who_created },
        {
          label: "Created At",
          value: new Date(draft.when_created).toLocaleString(),
        },
        { label: "Updated By", value: draft.who_updated },
        {
          label: "Updated At",
          value: new Date(draft.when_updated).toLocaleString(),
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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Draft Details</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {draftId ? `Showing /drafts/${draftId}` : "Loading draft id..."}
      </p>

      <DynamicSection
        isLoading={isLoading}
        error={error}
        fields={draftFields}
        actions={
          <Link
            href="/drafts"
            className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Back to Drafts
          </Link>
        }
      />
    </main>
  );
}
