// HOA reply thread — inbound/outbound correspondence tied to a submittal.
// Staff can log a reply manually from the portal; a public webhook route
// (/api/public/hoa-reply) will accept forwarded HOA emails from a mail
// provider when wired.
import { supabase } from "@/integrations/supabase/client";

export type HoaReplyRow = {
  id: string;
  submittal_id: string;
  tenant_id: string | null;
  direction: "inbound" | "outbound";
  from_email: string | null;
  from_name: string | null;
  to_email: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  logged_by: string | null;
  provider_message_id: string | null;
  created_at: string;
};

const T = () => supabase.from("hoa_submittal_replies" as any) as any;

export async function listHoaReplies(submittalId: string): Promise<HoaReplyRow[]> {
  const { data, error } = await T()
    .select("*")
    .eq("submittal_id", submittalId)
    .order("received_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HoaReplyRow[];
}

export async function logHoaReply(input: {
  submittalId: string;
  tenantId: string | null;
  loggedBy: string | null;
  direction?: "inbound" | "outbound";
  fromEmail?: string | null;
  fromName?: string | null;
  toEmail?: string | null;
  subject: string;
  bodyText: string;
  receivedAt?: string | null;
}): Promise<HoaReplyRow> {
  const { data, error } = await T()
    .insert({
      submittal_id: input.submittalId,
      tenant_id: input.tenantId,
      direction: input.direction ?? "inbound",
      from_email: input.fromEmail ?? null,
      from_name: input.fromName ?? null,
      to_email: input.toEmail ?? null,
      subject: input.subject,
      body_text: input.bodyText,
      received_at: input.receivedAt ?? new Date().toISOString(),
      logged_by: input.loggedBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as HoaReplyRow;
}
