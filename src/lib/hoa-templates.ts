// HOA Community Template Repository — shared library of HOA/ARC configurations.
// Every submittal builds on this repository so the next GC never re-sets up
// the same community.
import { supabase } from "@/integrations/supabase/client";

export type HoaSubmissionMethod = "email" | "portal" | "in_person" | "mail";

export type HoaTemplateRequiredDoc = {
  key: string;
  label: string;
  required: boolean;
};

export type HoaTemplateRow = {
  id: string;
  community_name: string;
  city: string;
  hoa_contact_name: string | null;
  hoa_contact_email: string | null;
  hoa_contact_phone: string | null;
  submission_method: HoaSubmissionMethod | null;
  submission_portal_url: string | null;
  required_documents: HoaTemplateRequiredDoc[];
  deposit_amount_cents: number;
  deposit_type: string | null;
  arc_meeting_notes: string | null;
  form_template: Record<string, unknown>;
  uploaded_form_path: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_by: string | null;
  created_by_tenant_id: string | null;
  created_at: string;
  updated_at: string;
};

export type HoaTemplateInsert = Partial<
  Omit<HoaTemplateRow, "id" | "created_at" | "updated_at" | "usage_count" | "last_used_at">
> & { community_name: string; city: string };

export function displayNameFor(row: Pick<HoaTemplateRow, "community_name" | "city">): string {
  return `${row.community_name} (${row.city})`;
}

const T = () => supabase.from("hoa_templates" as any) as any;

export async function listHoaTemplates(): Promise<HoaTemplateRow[]> {
  const { data, error } = await T()
    .select("*")
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("community_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HoaTemplateRow[];
}

export async function searchHoaTemplates(q: string): Promise<HoaTemplateRow[]> {
  const term = q.trim();
  if (!term) return listHoaTemplates();
  const like = `%${term.replace(/[%_]/g, "")}%`;
  const { data, error } = await T()
    .select("*")
    .or(`community_name.ilike.${like},city.ilike.${like}`)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as HoaTemplateRow[];
}

export async function getHoaTemplate(id: string): Promise<HoaTemplateRow | null> {
  const { data, error } = await T().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as HoaTemplateRow) ?? null;
}

export async function createHoaTemplate(row: HoaTemplateInsert): Promise<HoaTemplateRow> {
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as HoaTemplateRow;
}

export async function updateHoaTemplate(id: string, patch: Partial<HoaTemplateRow>): Promise<HoaTemplateRow> {
  const { data, error } = await T().update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as HoaTemplateRow;
}

/**
 * Bump usage_count and last_used_at when a submittal is created against this
 * template. Non-blocking — best effort.
 */
export async function markTemplateUsed(id: string): Promise<void> {
  const cur = await getHoaTemplate(id);
  if (!cur) return;
  await T()
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: (cur.usage_count ?? 0) + 1,
    })
    .eq("id", id);
}
