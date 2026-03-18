import { NextResponse } from "next/server";

type Dataset = {
  dataset_id: number;
  collection_id: number;
  license_id: number;
  dataset_doi: string;
  dataset_type: string;
  dataset_title: string;
  active: boolean;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

const datasets: Dataset[] = [
  {
    dataset_id: 1001,
    collection_id: 1,
    license_id: 1,
    dataset_doi: "10.1000/tcga.brca.1",
    dataset_type: "imaging",
    dataset_title: "TCGA BRCA Baseline Imaging",
    active: true,
    when_created: "2025-11-10T10:00:00.000Z",
    who_created: "system",
    when_updated: "2025-11-10T10:00:00.000Z",
    who_updated: "system",
  },
  {
    dataset_id: 1002,
    collection_id: 2,
    license_id: 2,
    dataset_doi: "10.1000/cptac.luad.1",
    dataset_type: "derived",
    dataset_title: "CPTAC LUAD Segmentations",
    active: true,
    when_created: "2025-11-11T09:30:00.000Z",
    who_created: "system",
    when_updated: "2025-11-12T12:15:00.000Z",
    who_updated: "curator",
  },
  {
    dataset_id: 1003,
    collection_id: 3,
    license_id: 1,
    dataset_doi: "10.1000/demo.archive.1",
    dataset_type: "archive",
    dataset_title: "POSDA Demo Dataset",
    active: false,
    when_created: "2025-11-13T14:45:00.000Z",
    who_created: "admin",
    when_updated: "2025-11-15T16:00:00.000Z",
    who_updated: "admin",
  },
];

export async function GET() {
  return NextResponse.json({
    datasets,
    total: datasets.length,
    timestamp: new Date().toISOString(),
  });
}