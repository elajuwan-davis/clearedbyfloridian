import { supabase } from "@/integrations/supabase/client";

export type NotifKind =
  | "permit_issued"
  | "inspection_passed"
  | "inspection_failed"
  | "action_required"
  | "submission_received";

export type NotifRow = {
  id: string;
  user_id: string | null;
  kind: NotifKind | string;
  title: string;
  body: string | null;
  permit_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotifPrefs = {
  user_id: string;
  email_permit_issued: boolean;
  email_inspection_passed: boolean;
  email_inspection_failed: boolean;
  email_action_required: boolean;
  email_submission_received: boolean;
  sms_permit_issued: boolean;
  sms_inspection_passed: boolean;
  sms_inspection_failed: boolean;
  sms_action_required: boolean;
  sms_submission_received: boolean;
  phone_number: string | null;
};

export async function listNotifications(limit = 50): Promise<NotifRow[]> {
  const { data, error } = await supabase
    .from("notifications" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotifRow[];
}

export async function unreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications" as any)
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function markRead(id: string): Promise<void> {
  await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllRead(): Promise<void> {
  await supabase
    .from("notifications" as any)
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}

export async function triggerNotification(input: {
  kind: NotifKind;
  title: string;
  body?: string;
  permit_id?: string | null;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id ?? null;
  try {
    await supabase.from("notifications" as any).insert({
      user_id: uid,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      permit_id: input.permit_id ?? null,
    });
  } catch {
    /* swallow — notifications are best-effort */
  }
}

export async function getPrefs(): Promise<NotifPrefs | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("notification_prefs" as any)
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  return (data as NotifPrefs) ?? null;
}

export async function upsertPrefs(patch: Partial<NotifPrefs>): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("Sign in required");
  await supabase.from("notification_prefs" as any).upsert({ user_id: uid, ...patch });
}

export function notifTitleForStatus(status: string, projectName: string): { kind: NotifKind; title: string } | null {
  switch (status) {
    case "permit_issued":
      return { kind: "permit_issued", title: `Permit issued — ${projectName}` };
    case "corrections_required":
      return { kind: "action_required", title: `Corrections required — ${projectName}` };
    case "on_hold":
      return { kind: "action_required", title: `Placed on hold — ${projectName}` };
    case "submitted":
      return { kind: "submission_received", title: `Submission received — ${projectName}` };
    default:
      return null;
  }
}
