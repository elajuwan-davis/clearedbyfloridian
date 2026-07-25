import { supabase } from "@/integrations/supabase/client";
import { triggerNotification } from "@/lib/notifications-api";
import { enqueueEmail } from "@/lib/email-outbox";

export type LienStatus = "not_requested" | "requested" | "signed" | "notarized" | "filed";

export type LienRelease = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  sub_key: string;
  sub_company: string;
  sub_email: string | null;
  trade: string | null;
  status: LienStatus;
  requested_at: string | null;
  signed_at: string | null;
  notarized_at: string | null;
  filed_at: string | null;
  last_reminder_at: string | null;
  signwell_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const LIEN_STATUS_LABEL: Record<LienStatus, string> = {
  not_requested: "Not Requested",
  requested: "Requested",
  signed: "Signed",
  notarized: "Notarized",
  filed: "Filed",
};

export const LIEN_STATUS_ORDER: LienStatus[] = ["not_requested", "requested", "signed", "notarized", "filed"];

export function lienStatusBadge(s: LienStatus): { label: string; className: string } {
  switch (s) {
    case "not_requested": return { label: "Not Requested", className: "border-obsidian/20 bg-obsidian/5 text-obsidian/70" };
    case "requested": return { label: "Requested", className: "border-blue-500/40 bg-blue-50 text-blue-800" };
    case "signed": return { label: "Signed", className: "border-amber-500/40 bg-amber-50 text-amber-900" };
    case "notarized": return { label: "Notarized", className: "border-indigo-500/40 bg-indigo-50 text-indigo-800" };
    case "filed": return { label: "Filed", className: "border-emerald-600/40 bg-emerald-50 text-emerald-800" };
  }
}

export async function listLienReleases(permitId: string): Promise<LienRelease[]> {
  const { data, error } = await supabase
    .from("lien_releases" as any)
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown) as LienRelease[];
}

/** Sync releases from a permit's subs list — creates a row per sub that doesn't have one. */
export async function syncFromSubs(
  permitId: string,
  tenantId: string | null,
  subs: Array<{ key?: string; company?: string; trade?: string; email?: string }>,
): Promise<LienRelease[]> {
  const existing = await listLienReleases(permitId);
  const haveKeys = new Set(existing.map((r) => r.sub_key));
  const toInsert = subs
    .map((s, i) => {
      const key = s.key || `${(s.company || "").toLowerCase()}::${(s.trade || "").toLowerCase()}::${i}`;
      return { key, s };
    })
    .filter(({ key, s }) => s.company && !haveKeys.has(key))
    .map(({ key, s }) => ({
      permit_id: permitId,
      tenant_id: tenantId,
      sub_key: key,
      sub_company: s.company!,
      sub_email: s.email ?? null,
      trade: s.trade ?? null,
      status: "not_requested" as LienStatus,
    }));
  if (toInsert.length) {
    await supabase.from("lien_releases" as any).insert(toInsert as any);
  }
  return listLienReleases(permitId);
}

export async function requestLienRelease(row: LienRelease, projectName: string, propertyAddress: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from("lien_releases" as any).update({
    status: "requested",
    requested_at: now,
    last_reminder_at: now,
  }).eq("id", row.id);

  if (row.sub_email) {
    const { data: auth } = await supabase.auth.getUser();
    await enqueueEmail({
      kind: "lien_release_request",
      to_email: row.sub_email,
      to_name: row.sub_company,
      subject: `Lien Release Request — ${projectName}`,
      body_text: [
        `${row.sub_company},`,
        ``,
        `Please sign your lien release for ${projectName} (${propertyAddress}).`,
        `After signing, this document must be notarized. You may complete both steps online with a remote notary.`,
        ``,
        `Reply to this email if you have any questions.`,
        ``,
        `— Cleard on behalf of the General Contractor`,
      ].join("\n"),
      tenant_id: row.tenant_id,
      created_by: auth?.user?.id ?? null,
    });
  }
}

export async function sendLienReminder(row: LienRelease, projectName: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from("lien_releases" as any).update({ last_reminder_at: now }).eq("id", row.id);
  if (row.sub_email) {
    const { data: auth } = await supabase.auth.getUser();
    await enqueueEmail({
      kind: "lien_release_reminder",
      to_email: row.sub_email,
      to_name: row.sub_company,
      subject: `Reminder: Lien Release still outstanding — ${projectName}`,
      body_text: [
        `${row.sub_company},`,
        ``,
        `This is a follow-up reminder — your lien release for ${projectName} is still outstanding.`,
        `Please sign and notarize it as soon as possible. Final payment cannot be released until it is filed.`,
        ``,
        `— Cleard`,
      ].join("\n"),
      tenant_id: row.tenant_id,
      created_by: auth?.user?.id ?? null,
    });
  }
}

export async function setLienStatus(id: string, next: LienStatus): Promise<LienRelease> {
  const patch: Record<string, unknown> = { status: next };
  const now = new Date().toISOString();
  if (next === "requested") patch.requested_at = now;
  if (next === "signed") patch.signed_at = now;
  if (next === "notarized") patch.notarized_at = now;
  if (next === "filed") patch.filed_at = now;
  const { data, error } = await supabase.from("lien_releases" as any)
    .update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return ((data as unknown) as LienRelease);
}

export async function deleteLienRelease(id: string): Promise<void> {
  const { error } = await supabase.from("lien_releases" as any).delete().eq("id", id);
  if (error) throw error;
}

export function allFiled(rows: LienRelease[]): boolean {
  return rows.length > 0 && rows.every((r) => r.status === "filed");
}

/** Notify GC when a sub is overdue (>5 business days since last reminder). */
export async function notifyOverdue(row: LienRelease, projectName: string, permitId: string): Promise<void> {
  await triggerNotification({
    kind: "action_required",
    title: `Lien release overdue — ${row.sub_company}`,
    body: `${row.sub_company} has not responded to their lien release request for ${projectName}. Cleard has sent an automatic follow-up.`,
    permit_id: permitId,
  });
}
