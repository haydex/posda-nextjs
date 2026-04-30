"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type Dataset = {
  dataset_id: number;
  dataset_type_id: number;
  dataset_type_name: string;
  dataset_doi: string;
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

type DatasetType = {
  dataset_type_id: number;
  dataset_type_name: string;
};

function extractArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const source = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

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
  const [datasetTypes, setDatasetTypes] = useState<DatasetType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    dataset_doi: "",
    dataset_type_id: "",
    dataset_name: "",
    active: false,
  });

  useEffect(() => {
    async function loadDatasetTypes() {
      try {
        const response = await fetch("/api/lookups/dataset-types", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as unknown;
        setDatasetTypes(
          extractArray<DatasetType>(json, ["data", "dataset_types"]),
        );
      } catch {
        setDatasetTypes([]);
      }
    }

    void loadDatasetTypes();
  }, []);

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
            dataset_type_id: String(dataset.dataset_type_id),
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
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};

    if (!formData.dataset_doi.trim()) {
      nextFieldErrors.dataset_doi = "DOI is required.";
    }

    if (!formData.dataset_type_id) {
      nextFieldErrors.dataset_type_id = "Type is required.";
    }

    if (!formData.dataset_name.trim()) {
      nextFieldErrors.dataset_name = "Name is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSaveError("Please fix the highlighted fields.");
      return;
    }

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
        body: JSON.stringify({
          dataset_type_id: Number(formData.dataset_type_id),
          dataset_doi: formData.dataset_doi,
          dataset_name: formData.dataset_name,
          active: formData.active,
        }),
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
      required: true,
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "dataset_type_id",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { value: "", label: "--- Select a value ---" },
        ...datasetTypes.map((datasetType) => ({
          value: String(datasetType.dataset_type_id),
          label: datasetType.dataset_type_name,
        })),
      ],
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
    },
    {
      key: "dataset_name",
      label: "Name",
      required: true,
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
        {datasetTypes.length === 0 && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            Could not load dataset types from the database.
          </p>
        )}

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
              onChange={(next) => {
                setFormData(next);
                setFieldErrors({});
                setSaveError(null);
              }}
              fields={fields}
              className="space-y-4"
              errors={fieldErrors}
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
