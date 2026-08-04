// Agent 6 — client side of status polling.
//
// Read-only: polling is a pg_cron job plus a service-role worker, so the browser only ever
// reads what they recorded (last portal status, correction notices, the staff digest).

import { supabase } from "@/integrations/supabase/client";

export type PortalStatusView = {
  portal_status: string | null;
  portal_status_raw: string | null;
  portal_status_checked_at: string | null;
  portal_status_changed_at: string | null;
};

export type CorrectionNotice = {
  id: string;
  permit_id: string;
  municipality_slug: string | null;
  source: "portal_poll" | "staff_upload" | "email";
  notice_label: string | null;
  issued_at: string | null;
  document_path: string | null;
  status: "new" | "parsing" | "parsed" | "resolved" | "dismissed";
  created_at: string;
};

export type StatusHistoryEntry = {
  id: string;
  from_status: string | null;
  to_status: string;
  portal_status_raw: string | null;
  created_at: string;
};

export type DigestRow = {
  bucket: "moved" | "stuck" | "check_failing";
  permit_id: string;
  municipality_slug: string | null;
  confirmation_number: string | null;
  detail: string;
  as_of: string | null;
};

// These tables post-date the generated integrations/supabase/types.ts — same untyped-table
// access used elsewhere in the app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (name: string) => supabase.from(name as any) as any;

export async function listCorrectionNotices(permitId: string): Promise<CorrectionNotice[]> {
  const { data, error } = await table("correction_notices")
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CorrectionNotice[];
}

export async function listStatusHistory(permitId: string): Promise<StatusHistoryEntry[]> {
  const { data, error } = await table("permit_status_history")
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as StatusHistoryEntry[];
}

/** The staff digest: what moved, what is stuck, and where the check itself is failing. */
export async function loadStatusDigest(days = 1): Promise<DigestRow[]> {
  const { data, error } = await supabase.rpc(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "permit_status_digest" as any,
    { _since: `${days} days` } as never,
  );
  if (error) throw new Error(error.message);
  return (data ?? []) as DigestRow[];
}

export async function correctionNoticeUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("permit-files").createSignedUrl(path, 600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
