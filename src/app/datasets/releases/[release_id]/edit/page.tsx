"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DynamicForm, { DynamicFormField } from "@/components/DynamicForm";

type DatasetRelease = {
	dataset_release_id: number;
	dataset_id: number;
	release_number: number;
	release_date: string;
	release_notes: string;
	when_created?: string;
	who_created?: string;
	when_updated?: string;
	who_updated?: string;
};

type DatasetReleaseResponse = {
	dataset_release?: DatasetRelease;
	data?: DatasetRelease;
	release?: DatasetRelease;
	timestamp: string;
};

type Dataset = {
	dataset_id: number;
	dataset_name: string;
};

type PageProps = {
	params: Promise<{
		release_id: string;
	}>;
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

function toDateInput(value?: string) {
	if (!value) {
		return "";
	}

	return value.slice(0, 10);
}

export default function DatasetReleaseEditPage({ params }: PageProps) {
	const router = useRouter();
	const [releaseId, setReleaseId] = useState<string | null>(null);
	const [datasets, setDatasets] = useState<Dataset[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const [formData, setFormData] = useState({
		dataset_id: "",
		release_number: "",
		release_date: "",
		release_notes: "",
	});

	useEffect(() => {
		let isMounted = true;

		async function loadRelease() {
			setIsLoading(true);
			setLoadError(null);

			const { release_id } = await params;
			const id = release_id;
			if (!isMounted) {
				return;
			}

			setReleaseId(id);

			try {
				const [releaseResponse, datasetsResponse] = await Promise.all([
					fetch(`/api/datasets/releases/${id}`, { cache: "no-store" }),
					fetch("/api/datasets?limit=1000", { cache: "no-store" }),
				]);

				if (!releaseResponse.ok) {
					throw new Error(`Could not load dataset release ${id}.`);
				}

				const releaseJson = (await releaseResponse.json()) as DatasetReleaseResponse;
				const release =
					releaseJson.dataset_release ??
					releaseJson.data ??
					releaseJson.release ??
					null;

				if (!release) {
					throw new Error("Release payload missing from response.");
				}

				if (datasetsResponse.ok) {
					const datasetsJson = (await datasetsResponse.json()) as unknown;
					const datasetsArray = extractArray<Dataset>(datasetsJson, [
						"datasets",
						"data",
						"items",
						"results",
					]);
					setDatasets(datasetsArray);
				}

				if (!isMounted) {
					return;
				}

				setFormData({
					dataset_id: String(release.dataset_id ?? ""),
					release_number: String(release.release_number ?? ""),
					release_date: toDateInput(release.release_date),
					release_notes: release.release_notes ?? "",
				});
			} catch (caughtError) {
				if (!isMounted) {
					return;
				}

				if (caughtError instanceof Error) {
					setLoadError(caughtError.message);
				} else {
					setLoadError("Could not load dataset release.");
				}
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

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!releaseId) {
			return;
		}

		setSaveError(null);
		setSaveSuccess(false);
		setIsSaving(true);

		try {
			const response = await fetch(`/api/datasets/releases/${releaseId}`, {
				method: "PUT",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					dataset_id: Number(formData.dataset_id),
					release_number: Number(formData.release_number),
					release_date: formData.release_date,
					release_notes: formData.release_notes,
				}),
			});

			if (!response.ok) {
				const fallbackMessage = "Could not update dataset release.";

				try {
					const json = (await response.json()) as { error?: string };
					throw new Error(json.error ?? fallbackMessage);
				} catch {
					throw new Error(fallbackMessage);
				}
			}

			setSaveSuccess(true);
			router.push(`/datasets/releases/${releaseId}`);
			router.refresh();
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setSaveError(caughtError.message);
			} else {
				setSaveError("Could not update dataset release.");
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
				<h1 className="text-3xl font-semibold tracking-tight">Edit Dataset Release</h1>
			</div>

			{isLoading && <p className="mt-4 text-sm">Loading release...</p>}

			{!isLoading && loadError && (
				<p className="mt-4 text-sm text-red-600 dark:text-red-400">
					{loadError}
				</p>
			)}

			{!isLoading && !loadError && (
				<section className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
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
									{isSaving ? "Saving..." : "Save Changes"}
								</button>

								<Link
									href={releaseId ? `/datasets/releases/${releaseId}` : "/datasets"}
									className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
								>
									Cancel
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
							Dataset release updated successfully.
						</p>
					)}
				</section>
			)}
		</main>
	);
}
