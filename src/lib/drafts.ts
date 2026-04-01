export type Draft = {
  dataset_release_draft_id: number;
  dataset_id: number;
  cloned_from_release_id: number | null;
  draft_name: string;
  draft_status: string;
  draft_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

export const drafts: Draft[] = [
  {
    dataset_release_draft_id: 5001,
    dataset_id: 1001,
    cloned_from_release_id: 301,
    draft_name: "BRCA Q1 Curated Draft",
    draft_status: "in_review",
    draft_notes: "Pending QC for series metadata normalization.",
    when_created: "2025-12-01T10:20:00.000Z",
    who_created: "curator1",
    when_updated: "2025-12-03T15:05:00.000Z",
    who_updated: "curator2",
  },
  {
    dataset_release_draft_id: 5002,
    dataset_id: 1002,
    cloned_from_release_id: null,
    draft_name: "LUAD Initial Draft",
    draft_status: "draft",
    draft_notes: "Initial ingest complete; annotations pending.",
    when_created: "2025-12-02T08:45:00.000Z",
    who_created: "system",
    when_updated: "2025-12-02T08:45:00.000Z",
    who_updated: "system",
  },
  {
    dataset_release_draft_id: 5003,
    dataset_id: 1003,
    cloned_from_release_id: 305,
    draft_name: "Demo Archive Refresh",
    draft_status: "approved",
    draft_notes: "Approved for publication in next release window.",
    when_created: "2025-12-04T12:00:00.000Z",
    who_created: "admin",
    when_updated: "2025-12-05T09:10:00.000Z",
    who_updated: "admin",
  },
];

export function getDraftById(id: number) {
  return drafts.find((draft) => draft.dataset_release_draft_id === id) ?? null;
}
