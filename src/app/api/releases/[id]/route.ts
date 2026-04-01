import { NextResponse } from "next/server";

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

  return NextResponse.json({
    releaseType: releaseResult.type,
    release: releaseResult.release,
    timestamp: new Date().toISOString(),
  });
}
