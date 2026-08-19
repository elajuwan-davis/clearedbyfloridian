import { supabase } from "@/integrations/supabase/client";

/** sessionStorage key holding how the visitor unlocked the deck. */
export const INVESTOR_ACCESS_KEY = "investor_access";
export type InvestorAccess = "domain_verified" | "code_verified";

export function readInvestorAccess(): InvestorAccess | null {
  try {
    const v = sessionStorage.getItem(INVESTOR_ACCESS_KEY);
    return v === "domain_verified" || v === "code_verified" ? v : null;
  } catch {
    return null;
  }
}

export function writeInvestorAccess(v: InvestorAccess) {
  try {
    sessionStorage.setItem(INVESTOR_ACCESS_KEY, v);
  } catch {
    /* sessionStorage unavailable */
  }
}

/** PATH 1 — check the email's domain against the allowlist. */
export async function checkEmailDomain(email: string): Promise<boolean> {
  const domain = email.trim().toLowerCase().split("@")[1]?.trim();
  if (!domain) return false;
  const { data, error } = await supabase
    .from("investor_allowed_domains")
    .select("domain")
    .eq("domain", domain)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

/** PATH 2 — validate a one-time code and burn it immediately. */
export async function redeemAccessCode(input: string): Promise<boolean> {
  const code = input.trim().toUpperCase();
  if (!code) return false;

  const { data, error } = await supabase
    .from("investor_access_codes")
    .select("code, used, expires_at")
    .eq("code", code)
    .eq("used", false)
    .maybeSingle();
  if (error || !data) return false;
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return false;

  const { error: burnError } = await supabase
    .from("investor_access_codes")
    .update({ used: true, used_at: new Date().toISOString() })
    .eq("code", code)
    .eq("used", false);
  if (burnError) return false;
  return true;
}
