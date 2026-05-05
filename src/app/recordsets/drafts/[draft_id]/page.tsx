"use client";

import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";
import { LinkButton } from "@/components/ui/Button";
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

      <DynamicSection
        isLoading={isLoading}
        error={error}
        fields={draftFields}
      />
    </PageShell>
  );
}
