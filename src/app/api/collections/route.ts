import { NextResponse } from "next/server";

type Collection = {
  collection_id: number;
  collection_code: string;
  collection_type: number;
  collection_short_title: string;
  collection_title: string;
  collection_name: string;
  active: boolean;
  when_created: string;
  who_created: string;
};

const collections: Collection[] = [
  {
    collection_id: 1,
    collection_code: "TCGA",
    collection_type: 1,
    collection_short_title: "TCGA-BRCA",
    collection_title: "TCGA Breast Invasive Carcinoma",
    collection_name: "The Cancer Genome Atlas - BRCA",
    active: true,
    when_created: "2025-11-02T12:00:00.000Z",
    who_created: "system",
  },
  {
    collection_id: 2,
    collection_code: "CPTAC",
    collection_type: 1,
    collection_short_title: "CPTAC-LUAD",
    collection_title: "CPTAC Lung Adenocarcinoma",
    collection_name: "Clinical Proteomic Tumor Analysis Consortium - LUAD",
    active: true,
    when_created: "2025-11-03T08:30:00.000Z",
    who_created: "system",
  },
  {
    collection_id: 3,
    collection_code: "DEMO",
    collection_type: 2,
    collection_short_title: "DEMO-ARCHIVE",
    collection_title: "Demo Archive Collection",
    collection_name: "POSDA Demo Archive",
    active: false,
    when_created: "2025-11-05T09:15:00.000Z",
    who_created: "admin",
  },
];

export async function GET() {
  return NextResponse.json({
    collections,
    total: collections.length,
    timestamp: new Date().toISOString(),
  });
}