import { NextResponse } from "next/server";
import { datasetReleases, recordsetReleases } from "@/lib/releases";

export async function GET() {
  return NextResponse.json({
    datasetReleases,
    recordsetReleases,
    totalDatasetReleases: datasetReleases.length,
    totalRecordsetReleases: recordsetReleases.length,
    timestamp: new Date().toISOString(),
  });
}