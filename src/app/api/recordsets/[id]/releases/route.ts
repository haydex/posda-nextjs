import { NextResponse } from "next/server";

import { getRecordsetById } from "@/lib/recordsets";
import { getRecordsetReleasesByRecordsetId } from "@/lib/releases";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const recordsetId = Number.parseInt(id, 10);

  if (!Number.isInteger(recordsetId)) {
    return NextResponse.json(
      { error: "Recordset id must be an integer." },
      { status: 400 },
    );
  }

  const recordset = getRecordsetById(recordsetId);

  if (!recordset) {
    return NextResponse.json(
      { error: `Recordset with id ${recordsetId} not found.` },
      { status: 404 },
    );
  }

  const releases = getRecordsetReleasesByRecordsetId(recordsetId);

  return NextResponse.json({
    recordset,
    releases,
    total: releases.length,
    timestamp: new Date().toISOString(),
  });
}
