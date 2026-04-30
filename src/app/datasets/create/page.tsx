"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type CreateDatasetResponse = {
  dataset_id?: number;
  data?: {
    dataset_id: number;
  };
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

export default function DatasetCreatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [datasetTypes, setDatasetTypes] = useState<DatasetType[]>([]);

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
        setDatasetTypes(extractArray<DatasetType>(json, ["data", "dataset_types"]));
      } catch {
        setDatasetTypes([]);
      }
    }

    void loadDatasetTypes();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/datasets`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dataset_type_id: Number(formData.dataset_type_id),
          dataset_name: formData.dataset_name,
          dataset_doi: formData.dataset_doi,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const fallbackMessage = "Could not create dataset.";

        try {
          const json = (await response.json()) as { error?: string };
          throw new Error(json.error ?? fallbackMessage);
        } catch {
          throw new Error(fallbackMessage);
        }
      }

      const json = (await response.json()) as CreateDatasetResponse;
      const newDatasetId = json.dataset_id ?? json.data?.dataset_id;

      if (!newDatasetId) {
        throw new Error("No dataset ID returned from create.");
      }

      setSaveSuccess(true);
      router.push(`/datasets/${newDatasetId}`);
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setSaveError(caughtError.message);
      } else {
        setSaveError("Could not create dataset.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const fields: Array<DynamicFormField<typeof formData>> = [
    {
      key: "dataset_doi",
      label: "DOI",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "dataset_type_id",
      label: "Type",
      type: "select",
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
        <h1 className="text-3xl font-semibold tracking-tight">Create Dataset</h1>
      </div>
      <p className="mt-4 text-zinc-600 dark:text-zinc-300">
        Add a new dataset to the system.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {datasetTypes.length === 0 && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            Could not load dataset types from the database.
          </p>
        )}

        <DynamicForm
          onSubmit={handleSubmit}
          values={formData}
          onChange={setFormData}
          fields={fields}
          className="space-y-4"
          actions={
            <>
              {saveError && (
                <p className="rounded-md bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {saveError}
                </p>
              )}

              {saveSuccess && (
                <p className="rounded-md bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  Dataset created successfully!
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {isSaving ? "Creating..." : "Create Dataset"}
                </button>

                <Link
                  href="/datasets"
                  className="inline-flex rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Cancel
                </Link>
              </div>
            </>
          }
        />
      </section>
    </main>
  );
}
