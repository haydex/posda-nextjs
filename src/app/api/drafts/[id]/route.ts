import { NextResponse } from "next/server";

import { getDraftById } from "@/lib/drafts";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draftId = Number.parseInt(id, 10);

  if (!Number.isInteger(draftId)) {
    return NextResponse.json(
      { error: "Draft id must be an integer." },
      { status: 400 },
    );
  }

  const draft = getDraftById(draftId);

  if (!draft) {
    return NextResponse.json(
      { error: `Draft with id ${draftId} not found.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    draft,
    timestamp: new Date().toISOString(),
  });
}
