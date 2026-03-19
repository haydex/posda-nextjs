import { NextResponse } from "next/server";

import { getCollectionById } from "@/lib/collections";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const collectionId = Number.parseInt(id, 10);

  if (!Number.isInteger(collectionId)) {
    return NextResponse.json(
      { error: "Collection id must be an integer." },
      { status: 400 },
    );
  }

  const collection = getCollectionById(collectionId);

  if (!collection) {
    return NextResponse.json(
      { error: `Collection with id ${collectionId} not found.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    collection,
    timestamp: new Date().toISOString(),
  });
}
