// Payment authorization storage + helpers.
// Stored locally only. Card numbers and CVV are NEVER stored — only brand + last 4 + expiry.

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

const LS_KEY = "cleared.payment-auth";

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

export function savePaymentAuth(record: PaymentAuthRecord): void {
  lsSave(record);
}

export function loadPaymentAuth(): PaymentAuthRecord | null {
  return lsLoad();
}

export function clearPaymentAuth(): void {
  lsClear();
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
