// GC-visible project notes per permit — tenant-scoped via RLS.
import { supabase } from "@/integrations/supabase/client";

export type ProjectNote = {
  id: string;
  permitId: string;
  author: string;
  body: string;
  createdAt: string;
};

const EVT = "project-notes:changed";

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

type NoteRow = {
  id: string;
  permit_id: string;
  author: string;
  note: string;
  created_at: string;
};

function mapRow(row: NoteRow): ProjectNote {
  return {
    id: row.id,
    permitId: row.permit_id,
    author: row.author,
    body: row.note,
    createdAt: row.created_at,
  };
}

async function resolveTenantId(permitId: string): Promise<string | null> {
  const { data } = await (supabase.from("permits" as any) as any)
    .select("tenant_id")
    .eq("id", permitId)
    .maybeSingle();
  return (data as { tenant_id: string | null } | null)?.tenant_id ?? null;
}

export async function listNotes(permitId: string): Promise<ProjectNote[]> {
  const { data, error } = await (supabase.from("project_notes" as any) as any)
    .select("id, permit_id, author, note, created_at")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as NoteRow[]).map(mapRow);
}

export async function addNote(
  permitId: string,
  author: string,
  body: string,
): Promise<ProjectNote | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const tenantId = await resolveTenantId(permitId);
  const { data, error } = await (supabase.from("project_notes" as any) as any)
    .insert({
      permit_id: permitId,
      tenant_id: tenantId,
      author,
      note: trimmed,
    })
    .select("id, permit_id, author, note, created_at")
    .single();
  if (error || !data) {
    console.error("[project-notes] insert failed", error?.message);
    return null;
  }
  notifyChanged();
  return mapRow(data as NoteRow);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await (supabase.from("project_notes" as any) as any).delete().eq("id", id);
  if (error) {
    console.error("[project-notes] delete failed", error.message);
    return;
  }
  notifyChanged();
}
