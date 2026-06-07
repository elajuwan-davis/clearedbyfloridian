// Payment authorization storage + helpers.
// Currently persists to localStorage. When Lovable Cloud is enabled,
// swap save/load to a `payment_authorizations` Supabase table.

export type PaymentAuthRecord = {
  cardholder: string;
  billingAddress: string;
  cardType: "Credit" | "Debit" | "ACH";
  brand: string; // Visa, Mastercard, Amex, Discover, ACH, Unknown
  last4: string;
  expiry: string; // MM/YY, empty for ACH
  authorizedAt: string; // ISO timestamp
  authorizationDate: string; // YYYY-MM-DD from form
  signatureDataUrl: string;
};

const KEY = "cleared.payment-auth";

export function savePaymentAuth(record: PaymentAuthRecord): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(record));
}

export function loadPaymentAuth(): PaymentAuthRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PaymentAuthRecord;
  } catch {
    return null;
  }
}

export function clearPaymentAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
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
