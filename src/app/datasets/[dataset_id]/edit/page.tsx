"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type Dataset = {
  dataset_id: number;
  dataset_doi: string;
  dataset_type: string;
  dataset_short_title: string;
  dataset_title: string;
  dataset_name: string;
  active: boolean;
  when_created: string;
  when_updated: string;
  who_created: string;
  who_updated: string;
};

type DatasetResponse = {
  dataset?: Dataset;
  data?: Dataset;
  timestamp: string;
};

type PageProps = {
  params: Promise<{
    dataset_id: string;
  }>;
};

export default function DatasetEditPage({ params }: PageProps) {
  const router = useRouter();
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    dataset_doi: "",
    dataset_type: "collection" as "collection" | "analysis_result",
    dataset_short_title: "",
    dataset_title: "",
    dataset_name: "",
    active: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadDataset() {
      setIsLoading(true);
      setError(null);

      const { dataset_id } = await params;
      const id = dataset_id;
      if (!isMounted) {
        return;
      }

      if (!id) {
        setError("Could not load dataset id.");
        setData(null);
        setIsLoading(false);
        return;
      }

      setDatasetId(id);

      try {
        const response = await fetch(`/api/datasets/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const fallbackMessage = `Could not load dataset ${id}.`;

          try {
            const json = (await response.json()) as { error?: string };
            throw new Error(json.error ?? fallbackMessage);
          } catch {
            throw new Error(fallbackMessage);
          }
        }

        const json = (await response.json()) as DatasetResponse;

        if (!isMounted) {
          return;
        }

        const dataset = json.dataset ?? json.data;
        setData({ ...json, dataset });

        if (dataset) {
          setFormData({
            dataset_doi: dataset.dataset_doi,
            dataset_type: dataset.dataset_type as
              | "collection"
              | "analysis_result",
            dataset_short_title: dataset.dataset_short_title,
            dataset_title: dataset.dataset_title,
            dataset_name: dataset.dataset_name,
            active: dataset.active,
          });
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        if (caughtError instanceof Error) {
          setError(caughtError.message);
        } else {
          setError(`Could not load dataset ${id}.`);
        }

        setData(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDataset();

    return () => {
      isMounted = false;
    };
  }, [params]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!datasetId) {
      setSaveError("Could not save dataset: missing dataset id.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const fallbackMessage = `Could not save dataset ${datasetId}.`;

        try {
          const json = (await response.json()) as { error?: string };
          throw new Error(json.error ?? fallbackMessage);
        } catch {
          throw new Error(fallbackMessage);
        }
      }

      setSaveSuccess(true);
      router.push(`/datasets/${datasetId}`);
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setSaveError(caughtError.message);
      } else {
        setSaveError(`Could not save dataset ${datasetId}.`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const dataset = data?.dataset ?? data?.data ?? null;
  const fields: Array<DynamicFormField<typeof formData>> = [
    {
      key: "dataset_doi",
      label: "DOI",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "dataset_type",
      label: "Type",
      type: "select",
      options: [{ value: "collection" }, { value: "analysis_result" }],
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
    },
    {
      key: "dataset_short_title",
      label: "Short Title",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "dataset_title",
      label: "Title",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "dataset_name",
      label: "Name",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "active",
      label: "Active",
      type: "checkbox",
      className: "flex items-center gap-2",
      controlClassName: "h-4 w-4",
    },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <div className="border-b-2 border-black pb-4 dark:border-white">
        <h1 className="text-3xl font-semibold tracking-tight">Edit Dataset</h1>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && dataset && (
          <>
            <div>
              <label className="block text-sm font-medium">Dataset ID</label>
              <input
                type="text"
                value={dataset.dataset_id}
                disabled
                className="mt-1 w-full rounded-md border border-black/15 bg-zinc-100 px-3 py-2 text-sm dark:border-white/20 dark:bg-zinc-900"
              />
              <p className="mt-1 text-xs text-zinc-500">Read-only</p>
            </div>

            <DynamicForm
              onSubmit={handleSubmit}
              values={formData}
              onChange={setFormData}
              fields={fields}
              className="space-y-4"
              actions={
                <>
                  <div className="space-y-2 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/50">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      <strong>Created:</strong>{" "}
                      {new Date(dataset.when_created).toLocaleString()} by{" "}
                      {dataset.who_created}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      <strong>Updated:</strong>{" "}
                      {new Date(dataset.when_updated).toLocaleString()} by{" "}
                      {dataset.who_updated}
                    </p>
                  </div>

                  {saveError && (
                    <p className="rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {saveError}
                    </p>
                  )}

                  {saveSuccess && (
                    <p className="rounded-md bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Dataset saved successfully!
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
                      href={`/datasets/${datasetId}`}
                      className="inline-flex rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Cancel
                    </Link>
                  </div>
                </>
              }
            />
          </>
        )}
      </section>
    </main>
  );
}
