export type Dataset = {
  dataset_id: number;
  dataset_doi: string;
  dataset_type: string;
  dataset_short_title: string;
  dataset_title: string;
  dataset_name: string;
  active: boolean;
  when_created: string;
  when_updated: string;
  who_created: string;
  who_updated: string;
};

export const datasets: Dataset[] = [
  {
    dataset_id: 1001,
    dataset_doi: "10.1000/tcga.brca.1",
    dataset_type: "imaging",
    dataset_short_title: "TCGA-BRCA",
    dataset_title: "TCGA BRCA Baseline Imaging",
    dataset_name: "The Cancer Genome Atlas Breast Invasive Carcinoma",
    active: true,
    when_created: "2025-11-10T10:00:00.000Z",
    when_updated: "2025-11-10T10:00:00.000Z",
    who_created: "system",
    who_updated: "system",
  },
  {
    dataset_id: 1002,
    dataset_doi: "10.1000/cptac.luad.1",
    dataset_type: "derived",
    dataset_short_title: "CPTAC-LUAD",
    dataset_title: "CPTAC LUAD Segmentations",
    dataset_name:
      "Clinical Proteomic Tumor Analysis Consortium Lung Adenocarcinoma",
    active: true,
    when_created: "2025-11-11T09:30:00.000Z",
    when_updated: "2025-11-12T12:15:00.000Z",
    who_created: "system",
    who_updated: "curator",
  },
  {
    dataset_id: 1003,
    dataset_doi: "10.1000/demo.archive.1",
    dataset_type: "archive",
    dataset_short_title: "DEMO-ARCHIVE",
    dataset_title: "POSDA Demo Dataset",
    dataset_name: "POSDA Demo Archive",
    active: false,
    when_created: "2025-11-13T14:45:00.000Z",
    when_updated: "2025-11-15T16:00:00.000Z",
    who_created: "admin",
    who_updated: "admin",
  },
];

export function getDatasetById(id: number) {
  return datasets.find((dataset) => dataset.dataset_id === id) ?? null;
}
