"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type Recordset = {
  recordset_id: number;
  recordset_doi: string;
  dataset_id: number;
  dataset_name: string;
  license_id: number;
  license_label: string;
  recordset_name?: string;
  recordset_type_id: number;
  recordset_type_name: string;
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

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const [datasetsRes, licensesRes, recordsetTypesRes] = await Promise.all([
          fetch("/api/datasets?limit=1000", { cache: "no-store" }),
          fetch("/api/lookups/licenses", { cache: "no-store" }),
          fetch("/api/lookups/recordset-types", { cache: "no-store" }),
        ]);

        if (datasetsRes.ok) {
          const datasetsJson = (await datasetsRes.json()) as unknown;
          setDatasets(extractArray<Dataset>(datasetsJson, ["data", "datasets"]));
        }

        if (licensesRes.ok) {
          const licensesJson = (await licensesRes.json()) as unknown;
          setLicenses(extractArray<License>(licensesJson, ["data", "licenses"]));
        }

        if (recordsetTypesRes.ok) {
          const recordsetTypesJson = (await recordsetTypesRes.json()) as unknown;
          setRecordsetTypes(
            extractArray<RecordsetType>(recordsetTypesJson, ["data", "recordset_types"]),
          );
        }
      } catch {
        setDatasets([]);
        setLicenses([]);
        setRecordsetTypes([]);
      } finally {
        setIsLoadingOptions(false);
      }
    }

    void loadOptions();

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
            recordset_type_id: String(recordset.recordset_type_id),
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
          recordset_type_id: Number(formData.recordset_type_id),
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
  const fields: Array<DynamicFormField<typeof formData>> = [
    {
      key: "dataset_id",
      label: "Dataset",
      type: "select",
      options: [
        { value: "", label: "--- Select a value ---" },
        ...datasets.map((dataset) => ({
          value: String(dataset.dataset_id),
          label: `${dataset.dataset_id} - ${dataset.dataset_name}`,
        })),
      ],
      controlClassName:
        "mt-1 w-full rounded-md border border-black/15 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-100",
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
        ...licenses.map((license) => ({
          value: String(license.license_id),
          label: license.license_label,
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
        <h1 className="text-3xl font-semibold tracking-tight">Edit Recordset</h1>
      </div>

      <section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
        {isLoadingOptions && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            Loading dataset, license, and recordset type options...
          </p>
        )}

        {isLoading && <p className="text-sm">Loading...</p>}

        {!isLoading && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {!isLoading && recordset && (
          <>
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
                </>
              }
            />
          </>
        )}
      </section>
    </main>
  );
}
