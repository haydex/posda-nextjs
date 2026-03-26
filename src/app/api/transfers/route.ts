import { NextResponse } from "next/server";

type Transfer = {
  dataset_release_transfer_id: number;
  dataset_release_id: number;
  destination_id: number;
  transfer_name: string;
  transfer_mode: string;
  transfer_status: string;
  transfer_notes: string;
  when_created: string;
  who_created: string;
  when_updated: string;
  who_updated: string;
};

const transfers: Transfer[] = [
  {
    dataset_release_transfer_id: 3001,
    dataset_release_id: 4001,
    destination_id: 5001,
    transfer_name: "TCGA BRCA Release Transfer",
    transfer_mode: "push",
    transfer_status: "pending",
    transfer_notes: "Queued for nightly processing.",
    when_created: "2025-11-21T09:00:00.000Z",
    who_created: "system",
    when_updated: "2025-11-21T09:00:00.000Z",
    who_updated: "system",
  },
  {
    dataset_release_transfer_id: 3002,
    dataset_release_id: 4002,
    destination_id: 5002,
    transfer_name: "CPTAC LUAD Transfer",
    transfer_mode: "pull",
    transfer_status: "completed",
    transfer_notes: "Transferred successfully to destination node.",
    when_created: "2025-11-22T10:20:00.000Z",
    who_created: "curator",
    when_updated: "2025-11-22T11:05:00.000Z",
    who_updated: "curator",
  },
  {
    dataset_release_transfer_id: 3003,
    dataset_release_id: 4003,
    destination_id: 5003,
    transfer_name: "Demo Archive Transfer",
    transfer_mode: "push",
    transfer_status: "failed",
    transfer_notes: "Destination rejected the archive payload.",
    when_created: "2025-11-23T14:40:00.000Z",
    who_created: "admin",
    when_updated: "2025-11-23T15:15:00.000Z",
    who_updated: "admin",
  },
];

export async function GET() {
  return NextResponse.json({
    transfers,
    total: transfers.length,
    timestamp: new Date().toISOString(),
  });
}