import { NextResponse } from "next/server";
import { drafts } from "@/lib/drafts";

export async function GET() {
  return NextResponse.json({
    drafts,
    total: drafts.length,
    timestamp: new Date().toISOString(),
  });
}