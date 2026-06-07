// Payment authorization storage + helpers.
// Persists to the `payment_authorizations` table in Supabase.
// Card numbers and CVV are NEVER stored — only brand + last 4 + expiry.

import { supabase } from "@/integrations/supabase/client";

export type PaymentAuthRecord = {
  cardholder: string;
  billingAddress: string;
  cardType: "Credit" | "Debit" | "ACH";
  brand: string;
  last4: string;
  expiry: string; // MM/YY, empty for ACH
  authorizedAt: string; // ISO timestamp
  authorizationDate: string; // YYYY-MM-DD
  signatureDataUrl: string;
};

type Row = {
  id: string;
  user_id: string;
  cardholder_name: string;
  billing_address: string;
  card_type: string;
  card_last_four: string;
  card_brand: string;
  expiry_month: number | null;
  expiry_year: number | null;
  authorized_at: string;
  created_at: string;
};

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

export async function savePaymentAuth(record: PaymentAuthRecord): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("You must be signed in to save a payment authorization.");

  let expiryMonth: number | null = null;
  let expiryYear: number | null = null;
  if (record.cardType !== "ACH" && /^\d{2}\/\d{2}$/.test(record.expiry)) {
    const [mm, yy] = record.expiry.split("/");
    expiryMonth = Number(mm);
    expiryYear = 2000 + Number(yy);
  }

  const payload = {
    user_id: userId,
    cardholder_name: record.cardholder,
    billing_address: record.billingAddress,
    card_type: record.cardType,
    card_last_four: record.last4,
    card_brand: record.brand,
    expiry_month: expiryMonth,
    expiry_year: expiryYear,
    authorized_at: record.authorizedAt,
  };

  const { error } = await supabase
    .from("payment_authorizations")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

export async function loadPaymentAuth(): Promise<PaymentAuthRecord | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("payment_authorizations")
    .select("*")
    .eq("user_id", userId)
    .order("authorized_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data as Row);
}

export async function clearPaymentAuth(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return;
  await supabase.from("payment_authorizations").delete().eq("user_id", userId);
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
