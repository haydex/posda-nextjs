import { NextResponse } from "next/server";

type Recordset = {
  recordset_id: number;
  recordset_doi: string;
  dataset_id: number;
  license_id: number;
  recordset_type: string;
  recordset_title: string;
  active: boolean;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

const recordsets: Recordset[] = [
  {
    recordset_id: 2001,
    recordset_doi: "10.1000/recordset.tcga.brca.1",
    dataset_id: 1001,
    license_id: 1,
    recordset_type: "imaging",
    recordset_title: "TCGA BRCA Baseline Recordset",
    active: true,
    when_created: "2025-11-16T10:00:00.000Z",
    who_created: "system",
    when_updated: "2025-11-16T10:00:00.000Z",
    who_updated: "system",
  },
  {
    recordset_id: 2002,
    recordset_doi: "10.1000/recordset.cptac.luad.1",
    dataset_id: 1002,
    license_id: 2,
    recordset_type: "derived",
    recordset_title: "CPTAC LUAD Derived Recordset",
    active: true,
    when_created: "2025-11-17T09:15:00.000Z",
    who_created: "curator",
    when_updated: "2025-11-18T12:45:00.000Z",
    who_updated: "curator",
  },
  {
    recordset_id: 2003,
    recordset_doi: "10.1000/recordset.demo.archive.1",
    dataset_id: 1003,
    license_id: 1,
    recordset_type: "archive",
    recordset_title: "POSDA Demo Archive Recordset",
    active: false,
    when_created: "2025-11-19T14:30:00.000Z",
    who_created: "admin",
    when_updated: "2025-11-20T16:05:00.000Z",
    who_updated: "admin",
  },
];

export async function GET() {
  return NextResponse.json({
    recordsets,
    total: recordsets.length,
    timestamp: new Date().toISOString(),
  });
}