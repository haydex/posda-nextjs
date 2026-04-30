"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type CreateRecordsetResponse = {
  recordset_id?: number;
  data?: {
    recordset_id: number;
  };
  timestamp: string;
};

type Dataset = {
  dataset_id: number;
  dataset_name: string;
};

type License = {
  license_id: number;
  license_label: string;
};

type RecordsetType = {
  recordset_type_id: number;
  recordset_type_name: string;
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

export default function RecordsetCreatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [recordsetTypes, setRecordsetTypes] = useState<RecordsetType[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [formData, setFormData] = useState({
    dataset_id: "",
    recordset_doi: "",
    license_id: "",
    recordset_name: "",
    recordset_type_id: "",
    active: true,
  });

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);
      try {
        const [datasetsRes, licensesRes] = await Promise.all([
          fetch("/api/datasets?limit=1000", { cache: "no-store" }),
          fetch("/api/lookups/licenses", { cache: "no-store" }),
        ]);

        const recordsetTypesRes = await fetch("/api/lookups/recordset-types", {
          cache: "no-store",
        });

        if (datasetsRes.ok) {
          const datasetsJson = (await datasetsRes.json()) as unknown;
          const datasetsArray = extractArray<Dataset>(datasetsJson, [
            "datasets",
            "data",
            "items",
            "results",
          ]);
          setDatasets(datasetsArray);
        }

        if (licensesRes.ok) {
          const licensesJson = (await licensesRes.json()) as unknown;
          const licensesArray = extractArray<License>(licensesJson, [
            "licenses",
            "data",
            "items",
            "results",
          ]);
          setLicenses(licensesArray);
        }

        if (recordsetTypesRes.ok) {
          const recordsetTypesJson = (await recordsetTypesRes.json()) as unknown;
          const recordsetTypesArray = extractArray<RecordsetType>(recordsetTypesJson, [
            "recordset_types",
            "data",
            "items",
            "results",
          ]);
          setRecordsetTypes(recordsetTypesArray);
        }
      } catch {
        setLicenses([]);
      } finally {
        setIsLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/recordsets`, {
        method: "POST",
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
          recordset_type_id: Number(formData.recordset_type_id),
          active: formData.active,
        }),
      });

      if (!response.ok) {
        const fallbackMessage = "Could not create recordset.";

        try {
          const json = (await response.json()) as { error?: string };
          throw new Error(json.error ?? fallbackMessage);
        } catch {
          throw new Error(fallbackMessage);
        }
      }

      const json = (await response.json()) as CreateRecordsetResponse;
      const newRecordsetId = json.recordset_id ?? json.data?.recordset_id;

      if (!newRecordsetId) {
        throw new Error("No recordset ID returned from create.");
      }

      setSaveSuccess(true);
      router.push(`/recordsets/${newRecordsetId}`);
      router.refresh();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setSaveError(caughtError.message);
      } else {
        setSaveError("Could not create recordset.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const fields: Array<DynamicFormField<typeof formData>> = [
    {
      key: "dataset_id",
      label: "Dataset",
      type: "select",
      options: [
        { value: "", label: "--- Select a value ---" },
        ...datasets.map((d) => ({
          value: String(d.dataset_id),
          label: `${d.dataset_id} - ${d.dataset_name}`,
        })),
      ],
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
    },
    {
      key: "recordset_doi",
      label: "DOI",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "license_id",
      label: "License",
      type: "select",
      options: [
        { value: "", label: "--- Select a value ---" },
        ...licenses.map((l) => ({
          value: String(l.license_id),
          label: l.license_label,
        })),
      ],
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
    },
    {
      key: "recordset_name",
      label: "Name",
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
    },
    {
      key: "recordset_type_id",
      label: "Type",
      type: "select",
      options: [
        { value: "", label: "--- Select a value ---" },
        ...recordsetTypes.map((recordsetType) => ({
          value: String(recordsetType.recordset_type_id),
          label: recordsetType.recordset_type_name,
        })),
      ],
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
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
        <h1 className="text-3xl font-semibold tracking-tight">Create Recordset</h1>
      </div>
      <p className="mt-4 text-zinc-600 dark:text-zinc-300">
        Add a new recordset to the system.
      </p>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoadingOptions && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            Loading dataset and license options...
          </p>
        )}

        {!isLoadingOptions && licenses.length === 0 && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            Could not load licenses from the database.
          </p>
        )}

        {!isLoadingOptions && recordsetTypes.length === 0 && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            Could not load recordset types from the database.
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
                  Recordset created successfully!
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving || isLoadingOptions}
                  className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {isLoadingOptions
                    ? "Loading Options..."
                    : isSaving
                      ? "Creating..."
                      : "Create Recordset"}
                </button>

                <Link
                  href="/recordsets"
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
