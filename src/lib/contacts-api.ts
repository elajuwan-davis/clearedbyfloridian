// Shared contact book (public.contacts), scoped by tenant with admin-wide access.
import { supabase } from "@/integrations/supabase/client";
import { getImpersonatedTenantId } from "@/lib/use-session";

export const CONTACT_TYPES = [
  "subcontractor",
  "architect",
  "engineer",
  "supplier",
  "inspector",
  "municipality",
  "homeowner",
  "other",
] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  subcontractor: "Subcontractor",
  architect: "Architect",
  engineer: "Engineer",
  supplier: "Supplier",
  inspector: "Inspector",
  municipality: "Municipality",
  homeowner: "Homeowner",
  other: "Other",
};

export type ContactRow = {
  id: string;
  tenant_id: string | null;
  created_by: string | null;
  name: string;
  company: string | null;
  contact_type: ContactType;
  trade: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null
  created_at: string;
  updated_at: string;
};

export type ContactInput = {
  name: string;
  company?: string | null;
  contact_type: ContactType;
  trade?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

async function currentContext(): Promise<{ userId: string | null; tenantId: string | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;
  if (!userId) return { userId: null, tenantId: null };
  const impersonated = getImpersonatedTenantId();
  if (impersonated) return { userId, tenantId: impersonated };
  const { data } = await (supabase.from("tenant_members" as any) as any)
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  return { userId, tenantId: (data as any)?.tenant_id ?? null };
}

export async function listContacts(): Promise<ContactRow[]> {
  const { data, error } = await (supabase.from("contacts" as any) as any)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactRow[];
}

export async function createContact(input: ContactInput): Promise<ContactRow> {
  const { userId, tenantId } = await currentContext();
  const { data, error } = await (supabase.from("contacts" as any) as any)
    .insert({ ...input, created_by: userId, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ContactRow;
}

export async function updateContact(id: string, input: ContactInput): Promise<void> {
  const { error } = await (supabase.from("contacts" as any) as any).update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await (supabase.from("contacts" as any) as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
