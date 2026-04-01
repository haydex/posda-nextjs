import { NextResponse } from "next/server";

import { getDatasetById } from "@/lib/datasets";
import { getDatasetReleasesByDatasetId } from "@/lib/releases";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const datasetId = Number.parseInt(id, 10);

  if (!Number.isInteger(datasetId)) {
    return NextResponse.json(
      { error: "Dataset id must be an integer." },
      { status: 400 },
    );
  }

  const dataset = getDatasetById(datasetId);

  if (!dataset) {
    return NextResponse.json(
      { error: `Dataset with id ${datasetId} not found.` },
      { status: 404 },
    );
  }

  const releases = getDatasetReleasesByDatasetId(datasetId);

  return NextResponse.json({
    dataset,
    releases,
    total: releases.length,
    timestamp: new Date().toISOString(),
  });
}
