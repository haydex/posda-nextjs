"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DynamicSection, {
	DynamicSectionField,
} from "@/components/DynamicSection";
import DynamicTable from "@/components/DynamicTable";

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

type RecordsetRelease = {
	recordset_release_id: number;
	recordset_id: number;
	release_number: number;
	release_date: string;
	release_notes: string;
	recordset_name?: string;
};

type RecordsetReleaseRow = RecordsetRelease & {
	select: string;
};

type DatasetRecordset = {
	recordset_id: number;
	recordset_name?: string;
};

type RecordsetReleasesResponse = {
	recordsets?: RecordsetRelease[];
	releases?: RecordsetRelease[];
	data?: RecordsetRelease[];
	total?: number;
	meta?: { count?: number };
	timestamp?: string;
};

type PageProps = {
	params: Promise<{
		release_id: string;
	}>;
};

function normalizeRecordsetReleasesResponse(
	payload: unknown,
): { releases: RecordsetRelease[]; total: number } {
	const source = payload as RecordsetReleasesResponse | undefined;
	const releases = Array.isArray(source?.releases)
		? source.releases
		: Array.isArray(source?.recordsets)
			? source.recordsets
			: Array.isArray(source?.data)
				? source.data
				: [];

	const total =
		typeof source?.total === "number"
			? source.total
			: typeof source?.meta?.count === "number"
				? source.meta.count
				: releases.length;

	return { releases, total };
}

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

function formatDate(value?: string) {
	if (!value) {
		return "-";
	}

	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) {
		return "-";
	}

	return new Date(parsed).toLocaleDateString();
}

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

export default function DatasetReleaseByIdPage({ params }: PageProps) {
	const [releaseId, setReleaseId] = useState<string | null>(null);
	const [data, setData] = useState<DatasetReleaseResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [linkedRecordsetReleases, setLinkedRecordsetReleases] = useState<
		RecordsetRelease[]
	>([]);
	const [availableRecordsetReleases, setAvailableRecordsetReleases] = useState<
		RecordsetRelease[]
	>([]);
	const [selectedAvailableIds, setSelectedAvailableIds] = useState<
		Set<number>
	>(new Set());
	const [selectedLinkedIds, setSelectedLinkedIds] = useState<Set<number>>(
		new Set(),
	);
	const [isLoadingRecordsets, setIsLoadingRecordsets] = useState(false);
	const [recordsetsError, setRecordsetsError] = useState<string | null>(null);
	const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
	const [availableError, setAvailableError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [actionSuccess, setActionSuccess] = useState<string | null>(null);
	const [isUpdatingLinks, setIsUpdatingLinks] = useState(false);

	async function loadAvailableReleases(
		datasetId: number,
		linkedIds: Set<number>,
	) {
		setIsLoadingAvailable(true);
		setAvailableError(null);

		try {
			const recordsetsResponse = await fetch(
				`/api/recordsets?dataset_id=${datasetId}&limit=1000`,
				{ cache: "no-store" },
			);

			if (!recordsetsResponse.ok) {
				throw new Error("Could not load recordsets for this dataset.");
			}

			const recordsetsJson = (await recordsetsResponse.json()) as unknown;
			const recordsets = extractArray<DatasetRecordset>(recordsetsJson, [
				"recordsets",
				"data",
				"items",
				"results",
			]);

			const releasesByRecordset = await Promise.all(
				recordsets.map(async (recordset) => {
					try {
						const releasesResponse = await fetch(
							`/api/recordsets/${recordset.recordset_id}/releases?limit=1000`,
							{ cache: "no-store" },
						);

						if (!releasesResponse.ok) {
							return [] as RecordsetRelease[];
						}

						const releasesJson = (await releasesResponse.json()) as unknown;
						const { releases } = normalizeRecordsetReleasesResponse(
							releasesJson,
						);
						return releases.map((release) => ({
							...release,
							recordset_name: release.recordset_name ?? recordset.recordset_name,
						}));
					} catch {
						return [] as RecordsetRelease[];
					}
				}),
			);

			const flattened = releasesByRecordset.flat();
			const filtered = flattened.filter(
				(release) => !linkedIds.has(release.recordset_release_id),
			);

			setAvailableRecordsetReleases(filtered);
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setAvailableError(caughtError.message);
			} else {
				setAvailableError("Could not load available recordset releases.");
			}
			setAvailableRecordsetReleases([]);
		} finally {
			setIsLoadingAvailable(false);
		}
	}

	useEffect(() => {
		let isMounted = true;

		async function loadRelease() {
			setIsLoading(true);
			setError(null);
			setIsLoadingRecordsets(true);
			setRecordsetsError(null);
			setIsLoadingAvailable(true);
			setAvailableError(null);

			const { release_id } = await params;
			const id = release_id;
			if (!isMounted) {
				return;
			}

			setReleaseId(id);

			try {
				const response = await fetch(`/api/datasets/releases/${id}`, {
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error(`Could not load dataset release ${id}.`);
				}

				const json = (await response.json()) as DatasetReleaseResponse;
				const releasePayload =
					json.dataset_release ?? json.data ?? json.release ?? null;

				if (!releasePayload) {
					throw new Error("Release payload missing from response.");
				}

				if (!isMounted) {
					return;
				}

				setData({ ...json, dataset_release: releasePayload });

				try {
					const recordsetsResponse = await fetch(
						`/api/datasets/releases/${id}/recordsets`,
						{ cache: "no-store" },
					);

					if (!recordsetsResponse.ok) {
						throw new Error(
							`Could not load recordset releases for dataset release ${id}.`,
						);
					}

					const recordsetsJson = (await recordsetsResponse.json()) as unknown;
					const normalized = normalizeRecordsetReleasesResponse(recordsetsJson);
					const linked = normalized.releases;

					if (!isMounted) {
						return;
					}

					setLinkedRecordsetReleases(linked);
					setSelectedLinkedIds(new Set());
					const linkedIds = new Set(
						linked.map((release) => release.recordset_release_id),
					);
					await loadAvailableReleases(releasePayload.dataset_id, linkedIds);
				} catch (caughtError) {
					if (!isMounted) {
						return;
					}

					setLinkedRecordsetReleases([]);
					if (caughtError instanceof Error) {
						setRecordsetsError(caughtError.message);
					} else {
						setRecordsetsError(
							`Could not load recordset releases for dataset release ${id}.`,
						);
					}
				} finally {
					if (isMounted) {
						setIsLoadingRecordsets(false);
					}
				}
			} catch (caughtError) {
				if (!isMounted) {
					return;
				}

				if (caughtError instanceof Error) {
					setError(caughtError.message);
				} else {
					setError(`Could not load dataset release ${id}.`);
				}

				setData(null);
				setLinkedRecordsetReleases([]);
				setAvailableRecordsetReleases([]);
			} finally {
				if (isMounted) {
					setIsLoading(false);
					setIsLoadingRecordsets(false);
					setIsLoadingAvailable(false);
				}
			}
		}

		void loadRelease();

		return () => {
			isMounted = false;
		};
	}, [params]);

	const release = data?.dataset_release ?? data?.data ?? data?.release ?? null;
	const releaseFields: DynamicSectionField[] = release
		? [
				{ label: "Release ID", value: release.dataset_release_id },
				{ label: "Dataset ID", value: release.dataset_id },
				{ label: "Release Number", value: release.release_number },
				{ label: "Release Date", value: formatDate(release.release_date) },
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

	const availableRows: RecordsetReleaseRow[] = availableRecordsetReleases.map(
		(releaseItem) => ({
			...releaseItem,
			select: "",
		}),
	);
	const linkedRows: RecordsetReleaseRow[] = linkedRecordsetReleases.map(
		(releaseItem) => ({
			...releaseItem,
			select: "",
		}),
	);

	function toggleSelection(
		setState: React.Dispatch<React.SetStateAction<Set<number>>>,
		id: number,
	) {
		setState((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	async function refreshLists() {
		if (!releaseId || !release) {
			return;
		}

		setIsLoadingRecordsets(true);
		setRecordsetsError(null);
		setIsLoadingAvailable(true);
		setAvailableError(null);

		try {
			const recordsetsResponse = await fetch(
				`/api/datasets/releases/${releaseId}/recordsets`,
				{ cache: "no-store" },
			);

			if (!recordsetsResponse.ok) {
				throw new Error(
					`Could not load recordset releases for dataset release ${releaseId}.`,
				);
			}

			const recordsetsJson = (await recordsetsResponse.json()) as unknown;
			const normalized = normalizeRecordsetReleasesResponse(recordsetsJson);
			const linked = normalized.releases;
			setLinkedRecordsetReleases(linked);
			setSelectedLinkedIds(new Set());
			const linkedIds = new Set(
				linked.map((releaseItem) => releaseItem.recordset_release_id),
			);

			await loadAvailableReleases(release.dataset_id, linkedIds);
			setSelectedAvailableIds(new Set());
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setRecordsetsError(caughtError.message);
			} else {
				setRecordsetsError(
					`Could not load recordset releases for dataset release ${releaseId}.`,
				);
			}
		} finally {
			setIsLoadingRecordsets(false);
			setIsLoadingAvailable(false);
		}
	}

	async function handleAddSelected() {
		if (!releaseId || selectedAvailableIds.size === 0) {
			return;
		}

		setActionError(null);
		setActionSuccess(null);
		setIsUpdatingLinks(true);

		try {
			const response = await fetch(
				`/api/datasets/releases/${releaseId}/recordsets/add`,
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
					},
					body: JSON.stringify({
						recordset_release_ids: Array.from(selectedAvailableIds),
					}),
				},
			);

			if (!response.ok) {
				const fallbackMessage =
					"Could not link one or more recordset releases.";
				const message = await getApiErrorMessage(response, fallbackMessage);
				throw new Error(message);
			}

			setActionSuccess("Recordset releases linked successfully.");
			await refreshLists();
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setActionError(caughtError.message);
			} else {
				setActionError("Could not link recordset releases.");
			}
		} finally {
			setIsUpdatingLinks(false);
		}
	}

	async function handleRemoveSelected() {
		if (!releaseId || selectedLinkedIds.size === 0) {
			return;
		}

		setActionError(null);
		setActionSuccess(null);
		setIsUpdatingLinks(true);

		try {
			const response = await fetch(
				`/api/datasets/releases/${releaseId}/recordsets/remove`,
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
					},
					body: JSON.stringify({
						recordset_release_ids: Array.from(selectedLinkedIds),
					}),
				},
			);

			if (!response.ok) {
				const fallbackMessage =
					"Could not unlink one or more recordset releases.";
				const message = await getApiErrorMessage(response, fallbackMessage);
				throw new Error(message);
			}

			setActionSuccess("Recordset releases removed successfully.");
			await refreshLists();
		} catch (caughtError) {
			if (caughtError instanceof Error) {
				setActionError(caughtError.message);
			} else {
				setActionError("Could not remove recordset releases.");
			}
		} finally {
			setIsUpdatingLinks(false);
		}
	}

	return (
		<main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
			<div className="border-b-2 border-black pb-4 dark:border-white">
				<div className="flex items-center justify-between gap-4">
					<h1 className="text-3xl font-semibold tracking-tight">
						Dataset Release Details
					</h1>
					<div className="flex gap-3">
						<Link
							href={
								releaseId
									? `/datasets/releases/${releaseId}/edit`
									: "/datasets"
							}
							className="inline-flex rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
						>
							Edit Release
						</Link>
						<Link
							href={
								release?.dataset_id
									? `/datasets/${release.dataset_id}`
									: "/datasets"
							}
							className="inline-flex rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
						>
							Back to Dataset
						</Link>
					</div>
				</div>
			</div>

			<DynamicSection isLoading={isLoading} error={error} fields={releaseFields}>
				{!isLoading && release && (
					<div className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/15">
						<div className="flex items-center justify-between border-b-2 border-black pb-2 dark:border-white">
							<h2 className="text-lg font-semibold tracking-tight">
								Recordset Releases
							</h2>
						</div>

						{actionError && (
							<p className="mt-3 text-sm text-red-600 dark:text-red-400">
								{actionError}
							</p>
						)}

						{actionSuccess && !actionError && (
							<p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
								{actionSuccess}
							</p>
						)}

						<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
							<div className="rounded-md border border-black/10 p-3 dark:border-white/15">
								<div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
									Available Recordset Releases
								</div>
								{isLoadingAvailable && (
									<p className="text-sm">Loading available releases...</p>
								)}
								{!isLoadingAvailable && availableError && (
									<p className="text-sm text-red-600 dark:text-red-400">
										{availableError}
									</p>
								)}
								{!isLoadingAvailable && !availableError && (
									<DynamicTable<RecordsetReleaseRow>
										rows={availableRows}
										paginateRows={false}
										emptyMessage="No available recordset releases."
										columns={[
											{
												key: "select",
												label: "",
												render: (_, row) => (
													<input
														type="checkbox"
														checked={selectedAvailableIds.has(
															row.recordset_release_id,
														)}
														onChange={() =>
															toggleSelection(
																setSelectedAvailableIds,
																row.recordset_release_id,
															)
														}
														className="h-4 w-4"
													/>
												),
											},
											{ key: "recordset_name", label: "Recordset" },
											{ key: "recordset_id", label: "Recordset ID" },
											{ key: "release_number", label: "Version" },
											{ key: "release_date", label: "Date" },
										]}
										formatters={{
											release_date: (value) => formatDate(String(value)),
										}}
										getRowKey={(row) => row.recordset_release_id}
									/>
								)}
							</div>

							<div className="flex flex-col items-center justify-center gap-3">
								<button
									type="button"
									onClick={handleAddSelected}
									disabled={
									isUpdatingLinks || selectedAvailableIds.size === 0
								}
									className="w-32 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
								>
									Add →
								</button>
								<button
									type="button"
									onClick={handleRemoveSelected}
									disabled={
									isUpdatingLinks || selectedLinkedIds.size === 0
								}
									className="w-32 rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
								>
									← Remove
								</button>
							</div>

							<div className="rounded-md border border-black/10 p-3 dark:border-white/15">
								<div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
									Added to Dataset Release
								</div>
								{isLoadingRecordsets && (
									<p className="text-sm">Loading linked releases...</p>
								)}
								{!isLoadingRecordsets && recordsetsError && (
									<p className="text-sm text-red-600 dark:text-red-400">
										{recordsetsError}
									</p>
								)}
								{!isLoadingRecordsets && !recordsetsError && (
									<DynamicTable<RecordsetReleaseRow>
										rows={linkedRows}
										paginateRows={false}
										emptyMessage="No recordset releases linked."
										columns={[
											{
												key: "select",
												label: "",
												render: (_, row) => (
													<input
														type="checkbox"
														checked={selectedLinkedIds.has(
															row.recordset_release_id,
														)}
														onChange={() =>
															toggleSelection(
																setSelectedLinkedIds,
																row.recordset_release_id,
															)
														}
														className="h-4 w-4"
													/>
												),
											},
											{ key: "recordset_name", label: "Recordset" },
											{ key: "recordset_id", label: "Recordset ID" },
											{ key: "release_number", label: "Version" },
											{ key: "release_date", label: "Date" },
										]}
										formatters={{
											release_date: (value) => formatDate(String(value)),
										}}
										getRowKey={(row) => row.recordset_release_id}
									/>
								)}
							</div>
						</div>
					</div>
				)}
			</DynamicSection>
		</main>
	);
}
