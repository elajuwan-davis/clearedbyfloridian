// Payment authorization storage + helpers.
// Primary store: Supabase `payment_authorizations` table (per-user upsert).
// Fallback: localStorage — used when the user isn't signed in OR the table
// doesn't exist yet (e.g. migration not yet run). Never crashes the app.
// Card numbers and CVV are NEVER stored — only brand + last 4 + expiry.

import { supabase } from "@/integrations/supabase/client";

export type PaymentAuthRecord = {
  cardholder: string;
  billingAddress: string;
  cardType: "Credit" | "Debit" | "ACH";
  brand: string;
  last4: string;
  expiry: string; // MM/YY, empty for ACH
  authorizedAt: string;
  authorizationDate: string;
  signatureDataUrl: string;
};

type Row = {
  user_id: string;
  cardholder_name: string;
  billing_address: string;
  card_type: string;
  card_last_four: string;
  card_brand: string;
  expiry_month: number | null;
  expiry_year: number | null;
  authorized_at: string;
};

const LS_KEY = "cleared.payment-auth";

function rowToRecord(row: Row): PaymentAuthRecord {
  const mm = row.expiry_month ? String(row.expiry_month).padStart(2, "0") : "";
  const yy = row.expiry_year ? String(row.expiry_year).slice(-2) : "";
  return {
    cardholder: row.cardholder_name,
    billingAddress: row.billing_address,
    cardType: (row.card_type as PaymentAuthRecord["cardType"]) ?? "Credit",
    brand: row.card_brand,
    last4: row.card_last_four,
    expiry: mm && yy ? `${mm}/${yy}` : "",
    authorizedAt: row.authorized_at,
    authorizationDate: row.authorized_at.slice(0, 10),
    signatureDataUrl: "",
  };
}

function lsLoad(): PaymentAuthRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PaymentAuthRecord) : null;
  } catch {
    return null;
  }
}

function lsSave(r: PaymentAuthRecord): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

function lsClear(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// True when the Supabase error indicates a missing table / schema cache miss.
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === "42P01" || e.code === "PGRST205" || /does not exist|schema cache/i.test(e.message ?? "");
}

export async function savePaymentAuth(record: PaymentAuthRecord): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) {
      lsSave(record);
      return;
    }
    let expiryMonth: number | null = null;
    let expiryYear: number | null = null;
    if (record.cardType !== "ACH" && /^\d{2}\/\d{2}$/.test(record.expiry)) {
      const [mm, yy] = record.expiry.split("/");
      expiryMonth = Number(mm);
      expiryYear = 2000 + Number(yy);
    }
    const { error } = await supabase
      .from("payment_authorizations")
      .upsert({
        user_id: userId,
        cardholder_name: record.cardholder,
        billing_address: record.billingAddress,
        card_type: record.cardType,
        card_last_four: record.last4,
        card_brand: record.brand,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        authorized_at: record.authorizedAt,
      }, { onConflict: "user_id" });
    if (error) {
      if (isMissingTable(error)) {
        lsSave(record);
        return;
      }
      throw error;
    }
  } catch (err) {
    if (isMissingTable(err)) { lsSave(record); return; }
    // Network / unexpected: keep a local copy so the user doesn't lose input.
    lsSave(record);
    throw err;
  }
}

export async function loadPaymentAuth(): Promise<PaymentAuthRecord | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return lsLoad();
    const { data, error } = await supabase
      .from("payment_authorizations")
      .select("*")
      .eq("user_id", userId)
      .order("authorized_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      if (isMissingTable(error)) return lsLoad();
      return lsLoad();
    }
    return data ? rowToRecord(data as Row) : lsLoad();
  } catch {
    return lsLoad();
  }
}

export async function clearPaymentAuth(): Promise<void> {
  lsClear();
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;
    await supabase.from("payment_authorizations").delete().eq("user_id", userId);
  } catch {
    /* table may not exist — local copy already cleared */
  }
}

export function detectCardBrand(num: string): string {
  const n = num.replace(/\D/g, "");
  if (!n) return "Unknown";
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(6011|65|64[4-9])/.test(n)) return "Discover";
  return "Unknown";
}
