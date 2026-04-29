"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type CreateDatasetResponse = {
  dataset_id?: number;
  data?: {
    dataset_id: number;
  };
  timestamp: string;
};

export default function DatasetCreatePage() {
  const router = useRouter();
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
        body: JSON.stringify(formData),
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
        <h1 className="text-3xl font-semibold tracking-tight">Create Dataset</h1>
      </div>
      <p className="mt-4 text-zinc-600 dark:text-zinc-300">
        Add a new dataset to the system.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
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
