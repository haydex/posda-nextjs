import { NextResponse } from "next/server";
import { recordsets } from "@/lib/recordsets";

export async function GET() {
  return NextResponse.json({
    recordsets,
    total: recordsets.length,
    timestamp: new Date().toISOString(),
  });
}