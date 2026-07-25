// Email outbox — Cleard queues outgoing emails (HOA package, homeowner
// deposit notice) into a Supabase table. When the project's email domain is
// live, a downstream worker dispatches these rows through Lovable Emails.
// Until then, the queue captures full intent so nothing is lost.
import { supabase } from "@/integrations/supabase/client";

export type OutboxKind =
  | "hoa_submittal_to_hoa"
  | "hoa_deposit_to_homeowner"
  | "generic";

export type OutboxAttachment = {
  label: string;
  path: string; // permit-files bucket path
  filename?: string;
};

export type OutboxInsert = {
  kind: OutboxKind;
  to_email: string;
  to_name?: string | null;
  cc_emails?: string[];
  subject: string;
  body_text: string;
  body_html?: string | null;
  related_submittal_id?: string | null;
  attachments?: OutboxAttachment[];
  tenant_id: string | null;
  created_by: string | null;
};

export async function enqueueEmail(row: OutboxInsert): Promise<{ id: string }> {
  const { data, error } = await (supabase.from("email_outbox" as any) as any)
    .insert({
      kind: row.kind,
      to_email: row.to_email,
      to_name: row.to_name ?? null,
      cc_emails: row.cc_emails ?? [],
      subject: row.subject,
      body_text: row.body_text,
      body_html: row.body_html ?? null,
      related_submittal_id: row.related_submittal_id ?? null,
      attachments: row.attachments ?? [],
      status: "queued",
      tenant_id: row.tenant_id,
      created_by: row.created_by,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as any).id as string };
}

export async function listOutboxForSubmittal(submittalId: string) {
  const { data, error } = await (supabase.from("email_outbox" as any) as any)
    .select("*")
    .eq("related_submittal_id", submittalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    kind: OutboxKind;
    to_email: string;
    subject: string;
    status: string;
    sent_at: string | null;
    created_at: string;
  }>;
}
