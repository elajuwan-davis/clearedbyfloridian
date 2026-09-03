// Provider truth for a bundle-trade authorization. Isolated from
// bundle-signature.ts so the rule can load under tsx without Supabase / PDF.
//
// A ledger row on its own only means "sent" — SignWell has to confirm
// completion (status + statusSource) before a trade counts as signed.

export type TradeSignatureInput = {
  status?: string | null;
  statusSource?: string | null;
} | undefined;

export function tradeSignatureState(
  req: TradeSignatureInput,
): "pending" | "sent" | "signed" {
  if (!req) return "pending";
  if (req.status === "signed" && req.statusSource === "provider_confirmed") return "signed";
  return "sent";
}
