"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicSection, {
  DynamicSectionField,
} from "@/components/DynamicSection";

type RecordsetRelease = {
  recordset_release_id: number;
  recordset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated?: string;
  who_updated?: string;
};

type ReleaseResponse = {
  releaseType?: "dataset" | "recordset";
  release?: RecordsetRelease;
  data?: RecordsetRelease;
  timestamp: string;
};

async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const json = (await response.json()) as {
      error?: string | { message?: string };
      message?: string;
    };
    if (typeof json?.error === "string") {
      return json.error;
    }
    if (json?.error && typeof json.error.message === "string") {
      return json.error.message;
    }
    if (typeof json?.message === "string") {
      return json.message;
    }
  } catch {
    // ignore
  }

  try {
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

type PageProps = {
  params: Promise<{
    release_id: string;
  }>;
};

export default function ReleaseByIdPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ReleaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRelease() {
      setIsLoading(true);
      setError(null);

      const { release_id } = await params;
      const id = release_id;
      const recordsetIdFromQuery = searchParams.get("recordset_id");
      if (!isMounted) {
        return;
      }

      try {
        const endpoint = recordsetIdFromQuery
          ? `/api/recordsets/${recordsetIdFromQuery}/releases/${id}`
          : `/api/recordsets/releases/${id}`;
        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load release ${id}.`;
          const message = await getApiErrorMessage(response, fallbackMessage);
          throw new Error(message);
        }

        const json = (await response.json()) as ReleaseResponse;

        if (!isMounted) {
          return;
        }

        setData({ ...json, release: json.release ?? json.data });
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
  }, [params, searchParams]);

  const release = data?.release ?? data?.data ?? null;
  const releaseFields: DynamicSectionField[] = release
    ? [
        { label: "Release ID", value: release.recordset_release_id },
        { label: "Recordset ID", value: release.recordset_id },
        { label: "Release Number", value: release.release_number },
        {
          label: "Release Date",
          value: new Date(release.release_date).toLocaleDateString(),
        },
        { label: "Created By", value: release.who_created ?? "-" },
        {
          label: "Created At",
          value: release.when_created
            ? new Date(release.when_created).toLocaleString()
            : "-",
        },
        { label: "Updated By", value: release.who_updated ?? "-" },
        {
          label: "Updated At",
          value: release.when_updated
            ? new Date(release.when_updated).toLocaleString()
            : "-",
        },
        {
          label: "Release Notes",
          value: release.release_notes,
          fullWidth: true,
          valueClassName: "mt-1 whitespace-pre-wrap text-xs",
        },
      ]
    : [];

  const recordsetId = release?.recordset_id ?? searchParams.get("recordset_id");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <div className="border-b-2 border-black pb-4 dark:border-white">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Release Details</h1>
          <div className="flex gap-3">
            <Link
              href={recordsetId ? `/recordsets/${recordsetId}` : "/recordsets"}
              className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Back to Recordset
            </Link>
          </div>
        </div>
      </div>

      <DynamicSection isLoading={isLoading} error={error} fields={releaseFields} />
    </main>
  );
}
