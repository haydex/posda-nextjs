import { NextResponse } from "next/server";
import { datasets } from "@/lib/datasets";

export async function GET() {
  return NextResponse.json({
    datasets,
    total: datasets.length,
    timestamp: new Date().toISOString(),
  });
}