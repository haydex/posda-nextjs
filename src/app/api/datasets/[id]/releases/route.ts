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
  const { searchParams } = new URL(_request.url);
  const latestOnlyParam = searchParams.get("latest_only");

  let latestOnly = false;
  if (latestOnlyParam !== null) {
    const latestOnlyRaw = latestOnlyParam.trim().toLowerCase();

    if (
      latestOnlyRaw === "" ||
      latestOnlyRaw === "true" ||
      latestOnlyRaw === "1" ||
      latestOnlyRaw === "yes"
    ) {
      latestOnly = true;
    } else if (
      latestOnlyRaw === "false" ||
      latestOnlyRaw === "0" ||
      latestOnlyRaw === "no"
    ) {
      latestOnly = false;
    } else {
      return NextResponse.json(
        {
          error:
            "latest_only must be one of: true, false, 1, 0, yes, no (or present with no value).",
        },
        { status: 400 },
      );
    }
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

  const releases = getDatasetReleasesByDatasetId(datasetId);
  const latestReleaseNumber = Math.max(
    ...releases.map((entry) => entry.release_number),
  );
  const filteredReleases = latestOnly
    ? releases.filter(
        (release) => release.release_number === latestReleaseNumber,
      )
    : releases;

  return NextResponse.json({
    dataset,
    releases: filteredReleases,
    total: filteredReleases.length,
    timestamp: new Date().toISOString(),
  });
}
