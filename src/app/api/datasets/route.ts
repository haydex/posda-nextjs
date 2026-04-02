import { NextResponse } from "next/server";
import { datasets } from "@/lib/datasets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search")?.trim().toLowerCase();
  const type = searchParams.get("type")?.trim().toLowerCase();
  const activeOnlyRaw = searchParams.get("active_only")?.trim().toLowerCase();

  let activeFilter: boolean | null = null;
  if (activeOnlyRaw === "true" || activeOnlyRaw === "1" || activeOnlyRaw === "yes") {
    activeFilter = true;
  } else if (activeOnlyRaw === "false" || activeOnlyRaw === "0" || activeOnlyRaw === "no") {
    activeFilter = false;
  }

  // print the received query parameters for debugging purposes
  console.log("Received query parameters:");
  console.log(`  search: ${search}`);
  console.log(`  type: ${type}`);
  console.log(
    `  active_only: ${activeOnlyRaw} (interpreted as ${String(activeFilter)})`,
  );

  const filteredDatasets = datasets.filter((dataset) => {
    if (activeFilter !== null && dataset.active !== activeFilter) {
      return false;
    }

    if (type && dataset.dataset_type.toLowerCase() !== type) {
      return false;
    }

    if (search) {
      const searchableFields = [
        dataset.dataset_title,
        dataset.dataset_name,
        dataset.dataset_short_title,
        dataset.dataset_doi,
      ];

      const matchesSearch = searchableFields.some((field) =>
        field.toLowerCase().includes(search),
      );

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  return NextResponse.json({
    datasets: filteredDatasets,
    total: filteredDatasets.length,
    timestamp: new Date().toISOString(),
  });
}