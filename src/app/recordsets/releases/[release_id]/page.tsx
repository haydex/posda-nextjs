"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";

type DatasetRelease = {
  dataset_release_id: number;
  dataset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type RecordsetRelease = {
  recordset_release_id: number;
  recordset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

type ReleaseResponse = {
  releaseType: "dataset" | "recordset";
  release: DatasetRelease | RecordsetRelease;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ReleaseByIdPage({ params }: PageProps) {
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [data, setData] = useState<ReleaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRelease() {
      setIsLoading(true);
      setError(null);

      const { id } = await params;
      if (!isMounted) {
        return;
      }

      setReleaseId(id);

      try {
        const response = await fetch(`/api/releases/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load release ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as ReleaseResponse;

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
          setError(`Could not load release ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRelease();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const release = data?.release ?? null;
  const releaseFields: DynamicSectionField[] = release
    ? [
        {
          label: "Release Type",
          value: data?.releaseType === "dataset" ? "Dataset" : "Recordset",
        },
        {
          label: "Release ID",
          value:
            data?.releaseType === "dataset"
              ? (release as DatasetRelease).dataset_release_id
              : (release as RecordsetRelease).recordset_release_id,
        },
        {
          label:
            data?.releaseType === "dataset" ? "Dataset ID" : "Recordset ID",
          value:
            data?.releaseType === "dataset"
              ? (release as DatasetRelease).dataset_id
              : (release as RecordsetRelease).recordset_id,
        },
        { label: "Release Number", value: release.release_number },
        {
          label: "Release Date",
          value: new Date(release.release_date).toLocaleDateString(),
        },
        { label: "Created By", value: release.who_created },
        {
          label: "Created At",
          value: new Date(release.when_created).toLocaleString(),
        },
        { label: "Updated By", value: release.who_updated },
        {
          label: "Updated At",
          value: new Date(release.when_updated).toLocaleString(),
        },
        {
          label: "Release Notes",
          value: release.release_notes,
          fullWidth: true,
          valueClassName: "mt-1 whitespace-pre-wrap text-xs",
        },
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Release Details</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {releaseId ? `Showing /releases/${releaseId}` : "Loading release id..."}
      </p>

      <DynamicSection
        isLoading={isLoading}
        error={error}
        fields={releaseFields}
        actions={
          <>
            <Link
              href={
                releaseId ? `/releases/${releaseId}/recordsets` : "/releases"
              }
              className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              View Related Recordsets
            </Link>

            <Link
              href="/releases"
              className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Back to Releases
            </Link>
          </>
        }
      />
    </main>
  );
}
