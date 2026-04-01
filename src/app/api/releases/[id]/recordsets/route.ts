import { NextResponse } from "next/server";

import { getRecordsetById, getRecordsetsByDatasetId } from "@/lib/recordsets";
import { getReleaseById } from "@/lib/releases";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const releaseId = Number.parseInt(id, 10);

  if (!Number.isInteger(releaseId)) {
    return NextResponse.json(
      { error: "Release id must be an integer." },
      { status: 400 },
    );
  }

  const releaseResult = getReleaseById(releaseId);

  if (!releaseResult) {
    return NextResponse.json(
      { error: `Release with id ${releaseId} not found.` },
      { status: 404 },
    );
  }

  const relatedRecordsets =
    releaseResult.type === "dataset"
      ? getRecordsetsByDatasetId(releaseResult.release.dataset_id)
      : [getRecordsetById(releaseResult.release.recordset_id)].filter(
          (recordset): recordset is NonNullable<typeof recordset> =>
            recordset !== null,
        );

  return NextResponse.json({
    releaseType: releaseResult.type,
    release: releaseResult.release,
    recordsets: relatedRecordsets,
    total: relatedRecordsets.length,
    timestamp: new Date().toISOString(),
  });
}
