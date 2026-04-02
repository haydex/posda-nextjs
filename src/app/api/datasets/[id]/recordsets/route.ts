import { NextResponse } from "next/server";

import { getDatasetById } from "@/lib/datasets";
import { getRecordsetsByDatasetId } from "@/lib/recordsets";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const datasetId = Number.parseInt(id, 10);
  const { searchParams } = new URL(request.url);
  const activeOnlyRaw = searchParams.get("active_only")?.trim().toLowerCase();

  let activeFilter: boolean | null = null;
  if (
    activeOnlyRaw === "true" ||
    activeOnlyRaw === "1" ||
    activeOnlyRaw === "yes"
  ) {
    activeFilter = true;
  } else if (
    activeOnlyRaw === "false" ||
    activeOnlyRaw === "0" ||
    activeOnlyRaw === "no"
  ) {
    activeFilter = false;
  }

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

  const datasetRecordsets = getRecordsetsByDatasetId(datasetId);
  const filteredRecordsets =
    activeFilter === null
      ? datasetRecordsets
      : datasetRecordsets.filter(
          (recordset) => recordset.active === activeFilter,
        );

  return NextResponse.json({
    dataset,
    recordsets: filteredRecordsets,
    total: filteredRecordsets.length,
    timestamp: new Date().toISOString(),
  });
}
