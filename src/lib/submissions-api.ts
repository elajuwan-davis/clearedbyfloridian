import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import { getPermitFileUrl, downloadPermitFile } from "@/lib/permit-storage";

export type SubmissionStatus = "received" | "in_review" | "submitted_to_muni" | "complete";
export type SubmissionType = "full" | "partial";

export type ManifestEntry = {
  trade: string;
  trade_key: string;
  doc_key: string;
  doc_label: string;
  filename: string;
  storage_path: string | null;
  external_url?: string | null;
  required: boolean;
};

export type SubmissionRow = {
  id: string;
  permit_id: string;
  submitted_by: string | null;
  type: SubmissionType;
  trades_included: string[];      // trade labels
  trades_pending: string[];       // trade labels
  fee_cents: number;
  package_manifest: ManifestEntry[];
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
};

export type SubmissionInsert = Omit<SubmissionRow, "id" | "created_at" | "updated_at" | "submitted_by"> & {
  submitted_by?: string | null;
};

const T = () => supabase.from("submissions" as never) as any;

export async function listSubmissions(): Promise<SubmissionRow[]> {
  const { data, error } = await T().select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SubmissionRow[];
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const { data, error } = await T().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as SubmissionRow) ?? null;
}

export async function createSubmission(row: SubmissionInsert): Promise<SubmissionRow> {
  const { data: sess } = await supabase.auth.getSession();
  const submitted_by = sess.session?.user.id ?? null;
  const { data, error } = await T().insert({ ...row, submitted_by }).select("*").single();
  if (error) throw error;
  return data as SubmissionRow;
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<SubmissionRow> {
  const { data, error } = await T().update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  return data as SubmissionRow;
}

export function submissionStatusLabel(s: SubmissionStatus): string {
  return {
    received: "Received",
    in_review: "In Review",
    submitted_to_muni: "Submitted to Muni",
    complete: "Complete",
  }[s];
}

export function submissionStatusTone(s: SubmissionStatus): string {
  return {
    received: "bg-sky-600/10 text-sky-700 border-sky-600/30",
    in_review: "bg-amber-500/10 text-amber-800 border-amber-500/40",
    submitted_to_muni: "bg-indigo-600/10 text-indigo-800 border-indigo-600/30",
    complete: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
  }[s];
}

// Download all files listed in the manifest as a single .zip.
export async function downloadSubmissionZip(sub: SubmissionRow, permitName: string): Promise<void> {
  const zip = new JSZip();
  const grouped: Record<string, ManifestEntry[]> = {};
  for (const entry of sub.package_manifest) {
    if (!grouped[entry.trade]) grouped[entry.trade] = [];
    grouped[entry.trade].push(entry);
  }
  for (const [trade, entries] of Object.entries(grouped)) {
    const folder = zip.folder(sanitize(trade)) ?? zip;
    for (const e of entries) {
      if (!e.storage_path) continue;
      try {
        const blob = await downloadPermitFile(e.storage_path);
        folder.file(sanitize(e.filename), blob);
      } catch {
        folder.file(`MISSING__${sanitize(e.filename)}.txt`, `File not found in storage: ${e.storage_path}`);
      }
    }
  }
  // Manifest text
  const manifestText = [
    `Submission: ${sub.id}`,
    `Permit: ${permitName}`,
    `Type: ${sub.type}`,
    `Fee: $${(sub.fee_cents / 100).toFixed(2)}`,
    `Trades Included: ${sub.trades_included.join(", ")}`,
    `Trades Pending: ${sub.trades_pending.join(", ")}`,
    `Notes: ${sub.notes ?? ""}`,
    ``,
    `Files:`,
    ...sub.package_manifest.map((e) => `  [${e.trade}] ${e.doc_label} — ${e.filename}${e.required ? " (required)" : ""}`),
  ].join("\n");
  zip.file("MANIFEST.txt", manifestText);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitize(permitName)}-${sub.type}-${sub.id.slice(0, 8)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function viewManifestFile(path: string): Promise<string> {
  return getPermitFileUrl(path, 300);
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9._\- ]+/g, "_").slice(0, 100);
}
