import { NextResponse } from "next/server";
import { collections } from "@/lib/collections";

export async function GET() {
  return NextResponse.json({
    collections,
    total: collections.length,
    timestamp: new Date().toISOString(),
  });
}