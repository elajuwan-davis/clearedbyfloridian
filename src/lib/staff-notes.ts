// Internal-only staff notes per permit — never surfaced to the GC.
import { supabase } from "@/integrations/supabase/client";

export type StaffNote = {
  id: string;
  permitId: string;
  author: string;
  body: string;
  createdAt: string;
  isInternal: boolean;
};

const EVT = "staff-notes:changed";

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

type NoteRow = {
  id: string;
  permit_id: string;
  author: string;
  note: string;
  created_at: string;
  is_internal: boolean;
};

function mapRow(row: NoteRow): StaffNote {
  return {
    id: row.id,
    permitId: row.permit_id,
    author: row.author,
    body: row.note,
    createdAt: row.created_at,
    isInternal: row.is_internal,
  };
}

export async function listStaffNotes(permitId: string): Promise<StaffNote[]> {
  const { data, error } = await supabase
    .from("staff_notes")
    .select("id, permit_id, author, note, created_at, is_internal")
    .eq("permit_id", permitId)
    .eq("is_internal", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as NoteRow[]).map(mapRow);
}

export async function addStaffNote(
  permitId: string,
  author: string,
  body: string,
): Promise<StaffNote | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("staff_notes")
    .insert({
      permit_id: permitId,
      author,
      note: trimmed,
      is_internal: true,
    })
    .select("id, permit_id, author, note, created_at, is_internal")
    .single();
  if (error || !data) return null;
  notifyChanged();
  return mapRow(data as NoteRow);
}
