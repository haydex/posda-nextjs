"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type CreateDatasetReleaseResponse = {
	dataset_release_id?: number;
	data?: {
		dataset_release_id: number;
	};
	timestamp: string;
};

type Dataset = {
	dataset_id: number;
	dataset_name: string;
};

type DatasetRelease = {
	release_number?: number;
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

export default function DatasetReleaseCreatePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoadingOptions, setIsLoadingOptions] = useState(true);

	const [formData, setFormData] = useState({
		dataset_id: "",
		release_number: "",
		release_date: "",
		release_notes: "",
	});

	useEffect(() => {
		async function loadDatasets() {
			setIsLoadingOptions(true);
			try {
				const response = await fetch("/api/datasets?limit=1000", {
					cache: "no-store",
				});

				if (!response.ok) {
					setDatasets([]);
					return;
				}

				const json = (await response.json()) as unknown;
				const datasetsArray = extractArray<Dataset>(json, [
					"datasets",
					"data",
					"items",
					"results",
				]);
				setDatasets(datasetsArray);
			} catch {
				setDatasets([]);
			} finally {
				setIsLoadingOptions(false);
			}
		}

		void loadDatasets();
	}, []);

	useEffect(() => {
		const datasetIdFromQuery = searchParams.get("dataset_id");
		if (!datasetIdFromQuery) {
			return;
		}

		setFormData((prev) =>
			prev.dataset_id
				? prev
				: {
						...prev,
						dataset_id: datasetIdFromQuery,
					},
		);
	}, [searchParams]);

	useEffect(() => {
		const today = new Date();
		const todayIso = today.toISOString().slice(0, 10);
		setFormData((prev) =>
			prev.release_date
				? prev
				: {
						...prev,
						release_date: todayIso,
					},
		);
	}, []);

	useEffect(() => {
		const datasetId = formData.dataset_id;
		if (!datasetId || formData.release_number) {
			return;
		}

		let isMounted = true;

		async function loadReleaseNumber() {
			try {
				const response = await fetch(
					`/api/datasets/${datasetId}/releases?limit=1000`,
					{ cache: "no-store" },
				);

				if (!response.ok) {
					return;
				}

				const json = (await response.json()) as unknown;
				const releases = extractArray<DatasetRelease>(json, [
					"releases",
					"data",
					"items",
					"results",
				]);
				const maxRelease = releases.reduce((max, release) => {
					const number = Number(release.release_number);
					return Number.isFinite(number) && number > max ? number : max;
				}, 0);

				if (!isMounted) {
					return;
				}

				setFormData((prev) =>
					prev.release_number
						? prev
						: {
								...prev,
								release_number: String(maxRelease + 1),
							},
				);
			} catch {
				if (!isMounted) {
					return;
				}
				setFormData((prev) =>
					prev.release_number
						? prev
						: {
								...prev,
								release_number: "1",
							},
				);
			}
		}

		void loadReleaseNumber();

		return () => {
			isMounted = false;
		};
	}, [formData.dataset_id, formData.release_number]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSaveError(null);
		setSaveSuccess(false);
		setIsSaving(true);

		if (!formData.dataset_id) {
			setSaveError("Please select a dataset.");
			setIsSaving(false);
			return;
		}

		try {
			const response = await fetch(
				`/api/datasets/${formData.dataset_id}/releases`,
				{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					release_number: Number(formData.release_number),
					release_date: formData.release_date,
					release_notes: formData.release_notes,
				}),
				},
			);

			if (!response.ok) {
				const fallbackMessage = "Could not create dataset release.";

				try {
					const json = (await response.json()) as { error?: string };
					throw new Error(json.error ?? fallbackMessage);
				} catch {
					throw new Error(fallbackMessage);
				}
			}

			const json = (await response.json()) as CreateDatasetReleaseResponse;
			const newReleaseId = json.dataset_release_id ?? json.data?.dataset_release_id;

			if (!newReleaseId) {
				throw new Error("No dataset release ID returned from create.");
			}

			setSaveSuccess(true);
			router.push(`/datasets/releases/${newReleaseId}`);
			router.refresh();
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setSaveError(caughtError.message);
			} else {
				setSaveError("Could not create dataset release.");
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
				...datasets.map((dataset) => ({
					value: String(dataset.dataset_id),
					label: `${dataset.dataset_id} - ${dataset.dataset_name}`,
				})),
			],
			controlClassName:
				"mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100",
		},
		{
			key: "release_number",
			label: "Release Number",
			type: "number",
			inputMode: "numeric",
			controlClassName:
				"mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
		},
		{
			key: "release_date",
			label: "Release Date",
			type: "date",
			controlClassName:
				"mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
		},
		{
			key: "release_notes",
			label: "Release Notes",
			type: "textarea",
			rows: 5,
			controlClassName:
				"mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-white/20 dark:bg-zinc-950",
		},
	];

	return (
		<main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
			<div className="border-b-2 border-black pb-4 dark:border-white">
				<h1 className="text-3xl font-semibold tracking-tight">Create Dataset Release</h1>
			</div>
			<p className="mt-4 text-zinc-600 dark:text-zinc-300">
				Add a new release for a dataset.
			</p>

			<section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
				{isLoadingOptions && (
					<p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
						Loading dataset options...
					</p>
				)}

				<DynamicForm
					onSubmit={handleSubmit}
					values={formData}
					onChange={setFormData}
					fields={fields}
					className="space-y-4"
					actions={
						<div className="mt-6 flex flex-wrap gap-3">
							<button
								type="submit"
								disabled={isSaving}
								className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
							>
								{isSaving ? "Saving..." : "Create Release"}
							</button>

							<Link
								href={
									formData.dataset_id
										? `/datasets/${formData.dataset_id}`
										: "/datasets"
								}
								className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
							>
								Back to Dataset
							</Link>
						</div>
					}
				/>

				{saveError && (
					<p className="mt-4 text-sm text-red-600 dark:text-red-400">
						{saveError}
					</p>
				)}

				{saveSuccess && !saveError && (
					<p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
						Dataset release created successfully.
					</p>
				)}
			</section>
		</main>
	);
}
