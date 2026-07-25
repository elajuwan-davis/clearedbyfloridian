// HOA template versioning — every meaningful edit snapshots the previous
// row so template evolution is auditable.
import { supabase } from "@/integrations/supabase/client";
import type { HoaTemplateRow } from "@/lib/hoa-templates";

export type HoaTemplateVersion = {
  id: string;
  template_id: string;
  version: number;
  snapshot: HoaTemplateRow;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
};

const V = () => supabase.from("hoa_template_versions" as any) as any;

export async function listTemplateVersions(templateId: string): Promise<HoaTemplateVersion[]> {
  const { data, error } = await V()
    .select("*")
    .eq("template_id", templateId)
    .order("version", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HoaTemplateVersion[];
}

export async function insertTemplateVersion(
  templateId: string,
  version: number,
  snapshot: HoaTemplateRow,
  changedBy: string | null,
  summary: string,
): Promise<void> {
  try {
    await V().insert({
      template_id: templateId,
      version,
      snapshot,
      changed_by: changedBy,
      change_summary: summary,
    });
  } catch {
    // best-effort
  }
}
