import { supabase } from "@/integrations/supabase/client";

export type PermitResubmittal = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  version: number;
  correction_notes: string | null;
  document_paths: string[];
  resubmitted_at: string;
  created_at: string;
};

export async function listResubmittals(permitId: string): Promise<PermitResubmittal[]> {
  const { data, error } = await supabase
    .from("permit_resubmittals" as any)
    .select("*")
    .eq("permit_id", permitId)
    .order("version", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown) as PermitResubmittal[];
}

export async function nextVersion(permitId: string): Promise<number> {
  const rows = await listResubmittals(permitId);
  return (rows[0]?.version ?? 0) + 1;
}

export async function createResubmittal(input: {
  permit_id: string;
  tenant_id: string | null;
  correction_notes: string;
  document_paths?: string[];
}): Promise<PermitResubmittal> {
  const { data: auth } = await supabase.auth.getUser();
  const version = await nextVersion(input.permit_id);
  const { data, error } = await supabase
    .from("permit_resubmittals" as any)
    .insert({
      permit_id: input.permit_id,
      tenant_id: input.tenant_id,
      version,
      correction_notes: input.correction_notes,
      document_paths: input.document_paths ?? [],
      created_by: auth?.user?.id ?? null,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  // Flip permit status back to Cleared for Takeoff (submitted).
  await supabase.from("permits").update({ status: "submitted" } as any).eq("id", input.permit_id);

  return ((data as unknown) as PermitResubmittal);
}
