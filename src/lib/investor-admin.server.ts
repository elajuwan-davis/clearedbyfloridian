import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { INVESTOR_ADMIN_PASSWORD } from "./investor-admin-password";

export type AdminDomain = {
  id: string;
  domain: string;
  label: string;
  created_at: string;
};

export type AdminCode = {
  id: string;
  code: string;
  label: string;
  used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export function assertAdmin(password: string) {
  if (password !== INVESTOR_ADMIN_PASSWORD) throw new Error("Unauthorized");
}

export async function loadAdminData(): Promise<{ domains: AdminDomain[]; codes: AdminCode[] }> {
  const [domains, codes] = await Promise.all([
    supabaseAdmin
      .from("investor_allowed_domains")
      .select("id, domain, label, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("investor_access_codes")
      .select("id, code, label, used, used_at, expires_at, created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (domains.error) throw domains.error;
  if (codes.error) throw codes.error;
  return { domains: domains.data ?? [], codes: codes.data ?? [] };
}

export async function addDomain(label: string, rawDomain: string) {
  const domain = rawDomain.toLowerCase().replace(/^@/, "").trim();
  const { error } = await supabaseAdmin.from("investor_allowed_domains").insert({ label, domain });
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function removeDomain(id: string) {
  const { error } = await supabaseAdmin.from("investor_allowed_domains").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function generateCode(label: string, expiresAt: string | null) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomCode();
    const { error } = await supabaseAdmin.from("investor_access_codes").insert({
      code,
      label,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    if (!error) return { code };
    if (!error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
  }
  throw new Error("Could not generate a unique code, please try again.");
}
