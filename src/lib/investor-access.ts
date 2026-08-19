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

/** Shared passcode that always unlocks the deck. Change here to rotate it. */
export const INVESTOR_PASSCODE = "Victoria2026!";

/** PATH 2 — shared passcode, or a one-time code validated and burned atomically. */
export async function redeemAccessCode(input: string): Promise<boolean> {
  const raw = input.trim();
  if (!raw) return false;
  if (raw === INVESTOR_PASSCODE) return true;
  const { data, error } = await supabase.rpc("redeem_investor_code", {
    _code: raw.toUpperCase(),
  });
  if (error) return false;
  return data === true;
}

