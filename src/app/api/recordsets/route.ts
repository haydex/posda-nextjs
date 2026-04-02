import { NextResponse } from "next/server";
import { recordsets } from "@/lib/recordsets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const datasetIdRaw = searchParams.get("dataset_id")?.trim();
  const searchRaw = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const activeOnlyParam = searchParams.get("active_only");

  let datasetIdFilter: number | null = null;
  if (datasetIdRaw && datasetIdRaw.length > 0) {
    if (!/^\d+$/.test(datasetIdRaw)) {
      return NextResponse.json(
        { error: "dataset_id must be an integer." },
        { status: 400 },
      );
    }

    const parsedDatasetId = Number.parseInt(datasetIdRaw, 10);

    if (!Number.isSafeInteger(parsedDatasetId)) {
      return NextResponse.json(
        { error: "dataset_id must be an integer." },
        { status: 400 },
      );
    }

    datasetIdFilter = parsedDatasetId;
  }

  let activeFilter: boolean | null = null;
  if (activeOnlyParam !== null) {
    const activeOnlyRaw = activeOnlyParam.trim().toLowerCase();

    if (
      activeOnlyRaw === "" ||
      activeOnlyRaw === "true" ||
      activeOnlyRaw === "1" ||
      activeOnlyRaw === "yes"
    ) {
      activeFilter = true;
    } else if (
      activeOnlyRaw === "false" ||
      activeOnlyRaw === "0" ||
      activeOnlyRaw === "no"
    ) {
      activeFilter = false;
    } else {
      return NextResponse.json(
        {
          error:
            "active_only must be one of: true, false, 1, 0, yes, no (or present with no value).",
        },
        { status: 400 },
      );
    }
  }

  const filteredRecordsets = recordsets.filter((recordset) => {
    if (datasetIdFilter !== null && recordset.dataset_id !== datasetIdFilter) {
      return false;
    }

    if (activeFilter !== null && recordset.active !== activeFilter) {
      return false;
    }

    if (searchRaw.length > 0) {
      const activeSearchAliases = recordset.active
        ? ["true", "1", "yes", "active"]
        : ["false", "0", "no", "inactive"];

      const matchesSearch =
        recordset.recordset_title.toLowerCase().includes(searchRaw) ||
        recordset.recordset_doi.toLowerCase().includes(searchRaw) ||
        recordset.recordset_type.toLowerCase().includes(searchRaw) ||
        String(recordset.recordset_id).includes(searchRaw) ||
        String(recordset.dataset_id).includes(searchRaw) ||
        activeSearchAliases.includes(searchRaw);

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  return NextResponse.json({
    recordsets: filteredRecordsets,
    total: filteredRecordsets.length,
    timestamp: new Date().toISOString(),
  });
}