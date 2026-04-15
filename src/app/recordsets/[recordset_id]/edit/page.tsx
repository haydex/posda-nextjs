"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Recordset = {
  recordset_id: number;
  recordset_doi: string;
  dataset_id: number;
  license_id: number;
  recordset_type: string;
  recordset_title: string;
  active: boolean;
  when_created: string;
  when_updated: string;
  who_created: string;
  who_updated: string;
};

type RecordsetResponse = {
  recordset?: Recordset;
  data?: Recordset;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    recordset_id: string;
  }>;
};

export default function RecordsetEditPage({ params }: PageProps) {
  const router = useRouter();
  const [recordsetId, setRecordsetId] = useState<string | null>(null);
  const [data, setData] = useState<RecordsetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dataset_id: "",
    recordset_doi: "",
    license_id: "",
    recordset_name: "",
    recordset_type: "",
    recordset_title: "",
    active: false,
  });

  function getErrorMessage(payload: unknown, fallbackMessage: string) {
    if (!payload || typeof payload !== "object") {
      return fallbackMessage;
    }

    const errorPayload = payload as {
      error?: string | { message?: string; details?: unknown };
    };

    if (typeof errorPayload.error === "string") {
      return errorPayload.error;
    }

    if (errorPayload.error?.message) {
      return errorPayload.error.message;
    }

    return fallbackMessage;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadRecordset() {
      setIsLoading(true);
      setError(null);

      const { recordset_id } = await params;
      const id = recordset_id;
      if (!isMounted) {
        return;
      }

      if (!id) {
        setError("Could not load recordset id.");
        setData(null);
        setIsLoading(false);
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
        const recordset = json.recordset ?? json.data;

        if (!isMounted) {
          return;
        }

        setData({ ...json, recordset });

        if (recordset) {
          setFormData({
            dataset_id: String(recordset.dataset_id),
            recordset_doi:
              recordset.recordset_doi && recordset.recordset_doi !== "-"
                ? recordset.recordset_doi
                : "",
            license_id: String(recordset.license_id),
            recordset_name: recordset.recordset_name ?? "",
            recordset_type: recordset.recordset_type,
            recordset_title: recordset.recordset_title,
            active: recordset.active,
          });
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(`Could not load recordset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecordset();

    return () => {
      isMounted = false;
    };
  }, [params]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (!recordsetId) {
      setSaveError("Could not save recordset: missing recordset id.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/recordsets/${recordsetId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dataset_id: Number(formData.dataset_id),
          ...(formData.recordset_doi.trim()
            ? { recordset_doi: formData.recordset_doi.trim() }
            : {}),
          license_id: Number(formData.license_id),
          recordset_name: formData.recordset_name,
          recordset_type: formData.recordset_type,
          recordset_title: formData.recordset_title,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const fallbackMessage = `Could not save recordset ${recordsetId}.`;

        try {
          const json = (await response.json()) as unknown;
          throw new Error(getErrorMessage(json, fallbackMessage));
        } catch {
          throw new Error(fallbackMessage);
        }
      }

      router.push(`/recordsets/${recordsetId}`);
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setSaveError(caughtError.message);
      } else {
        setSaveError(`Could not save recordset ${recordsetId}.`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const recordset = data?.recordset ?? data?.data ?? null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Edit Recordset</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        {recordsetId
          ? `Editing /recordsets/${recordsetId}`
          : "Loading recordset id..."}
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && recordset && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Recordset ID</label>
              <input
                type="text"
                value={recordset.recordset_id}
                disabled
                className="mt-1 w-full rounded-md border border-black/15 bg-zinc-100 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
              />
              <p className="mt-1 text-xs text-zinc-500">Read-only</p>
            </div>

            <div>
              <label className="block text-sm font-medium">Dataset ID</label>
              <input
                type="text"
                value={formData.dataset_id}
                disabled
                className="mt-1 w-full rounded-md border border-black/15 bg-zinc-100 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
              />
              <p className="mt-1 text-xs text-zinc-500">Read-only</p>
            </div>

            <div>
              <label className="block text-sm font-medium">DOI</label>
              <input
                type="text"
                value={formData.recordset_doi}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    recordset_doi: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">License ID</label>
              <input
                type="number"
                value={formData.license_id}
                onChange={(event) =>
                  setFormData({ ...formData, license_id: event.target.value })
                }
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.recordset_name}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    recordset_name: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Type</label>
              <input
                type="text"
                value={formData.recordset_type}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    recordset_type: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.recordset_title}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    recordset_title: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recordset-active"
                checked={formData.active}
                onChange={(event) =>
                  setFormData({ ...formData, active: event.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="recordset-active" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="space-y-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Created:</strong>{" "}
                {new Date(recordset.when_created).toLocaleString()} by{" "}
                {recordset.who_created}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Updated:</strong>{" "}
                {new Date(recordset.when_updated).toLocaleString()} by{" "}
                {recordset.who_updated}
              </p>
            </div>

            {saveError && (
              <p className="rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {saveError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href={`/recordsets/${recordsetId}`}
                className="inline-flex rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
