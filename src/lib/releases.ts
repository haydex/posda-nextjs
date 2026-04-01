export type DatasetRelease = {
  dataset_release_id: number;
  dataset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

export type RecordsetRelease = {
  recordset_release_id: number;
  recordset_id: number;
  release_number: number;
  release_date: string;
  release_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

export const datasetReleases: DatasetRelease[] = [
  {
    dataset_release_id: 6001,
    dataset_id: 1001,
    release_number: 1,
    release_date: "2025-11-24T00:00:00.000Z",
    release_notes: "Initial dataset release.",
    when_created: "2025-11-24T09:00:00.000Z",
    who_created: "system",
    when_updated: "2025-11-24T09:00:00.000Z",
    who_updated: "system",
  },
  {
    dataset_release_id: 6002,
    dataset_id: 1002,
    release_number: 2,
    release_date: "2025-11-25T00:00:00.000Z",
    release_notes: "Expanded segmentation release.",
    when_created: "2025-11-25T10:15:00.000Z",
    who_created: "curator",
    when_updated: "2025-11-25T12:05:00.000Z",
    who_updated: "curator",
  },
  {
    dataset_release_id: 6003,
    dataset_id: 1003,
    release_number: 1,
    release_date: "2025-11-26T00:00:00.000Z",
    release_notes: "Demo archive release.",
    when_created: "2025-11-26T08:30:00.000Z",
    who_created: "admin",
    when_updated: "2025-11-26T08:30:00.000Z",
    who_updated: "admin",
  },
];

export const recordsetReleases: RecordsetRelease[] = [
  {
    recordset_release_id: 7001,
    recordset_id: 2001,
    release_number: 1,
    release_date: "2025-11-27T00:00:00.000Z",
    release_notes: "Initial recordset release.",
    when_created: "2025-11-27T09:05:00.000Z",
    who_created: "system",
    when_updated: "2025-11-27T09:05:00.000Z",
    who_updated: "system",
  },
  {
    recordset_release_id: 7002,
    recordset_id: 2002,
    release_number: 2,
    release_date: "2025-11-28T00:00:00.000Z",
    release_notes: "Derived recordset refresh.",
    when_created: "2025-11-28T10:40:00.000Z",
    who_created: "curator",
    when_updated: "2025-11-28T11:25:00.000Z",
    who_updated: "curator",
  },
  {
    recordset_release_id: 7003,
    recordset_id: 2003,
    release_number: 1,
    release_date: "2025-11-29T00:00:00.000Z",
    release_notes: "Demo archive release package.",
    when_created: "2025-11-29T14:10:00.000Z",
    who_created: "admin",
    when_updated: "2025-11-29T14:10:00.000Z",
    who_updated: "admin",
  },
];

export type ReleaseByIdResult =
  | { type: "dataset"; release: DatasetRelease }
  | { type: "recordset"; release: RecordsetRelease }
  | null;

export function getReleaseById(id: number): ReleaseByIdResult {
  const datasetRelease = datasetReleases.find(
    (release) => release.dataset_release_id === id,
  );

  if (datasetRelease) {
    return { type: "dataset", release: datasetRelease };
  }

  const recordsetRelease = recordsetReleases.find(
    (release) => release.recordset_release_id === id,
  );

  if (recordsetRelease) {
    return { type: "recordset", release: recordsetRelease };
  }

  return null;
}
