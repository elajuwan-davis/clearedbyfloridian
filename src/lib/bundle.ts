// Bundle state lives inside permits.intake_payload.bundle (no separate table).
import type { PermitRow, PermitDoc, PermitSub } from "@/lib/permits-api";
import { FLORIDIAN_FIRM } from "@/lib/floridian-firm";

export type BundleStatus = "draft" | "subs_signing" | "ready" | "submitted" | "partial";
export type BundleSigStatus = "pending" | "sent" | "signed";

export type BundleSubSnapshot = {
  company: string;
  contact?: string;
  email?: string;
  phone?: string;
  license?: string;
};

export type BundleTrade = {
  key: string;                     // slugified trade name, unique inside bundle
  label: string;                   // "Pool" | "Gas" | "Electric" | ...
  sub_id: string | null;
  sub_snapshot: BundleSubSnapshot | null;
  signature_status: BundleSigStatus;
  signature_sent_at?: string | null;
  signature_signed_at?: string | null;
  doc_keys: string[];              // permit-level document keys assigned to this trade
  ready: boolean;                  // GC readiness flag (for partial-submit selection)
  budgeted_fee_cents?: number;     // GC's day-one budget for this trade's permit fee
  fee_confirmed?: boolean;         // false = budgeted (italic), true = actual logged
};

export type TradeCardState = "no_sub" | "invited" | "active" | "signed";

export function tradeCardState(t: BundleTrade): TradeCardState {
  if (t.signature_status === "signed") return "signed";
  if (t.signature_status === "sent") return "invited";
  if (t.sub_snapshot?.company) return "active";
  return "no_sub";
}

export type Bundle = {
  enabled: boolean;
  status: BundleStatus;
  gc_fee_cents: number;
  gc_license_number: string;
  trades: BundleTrade[];
};

export type PermitIntakePayload = {
  hidden_fields?: string[];
  bundle?: Bundle;
  [k: string]: unknown;
};

export function slugTrade(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function tradeLabelFromSub(sub: PermitSub): string {
  return (sub.trade || sub.companyName || "Trade").trim();
}

export function subToSnapshot(sub: PermitSub): BundleSubSnapshot {
  return {
    company: sub.companyName,
    contact: sub.qualifierName || undefined,
    email: sub.contactEmail || undefined,
    license: sub.licenseNumber || undefined,
  };
}

export function bundleFromSubs(subs: PermitSub[] | null | undefined): Bundle {
  const list = (subs ?? []).filter((s) => s.companyName?.trim());
  const trades: BundleTrade[] = list.map((s) => {
    const label = tradeLabelFromSub(s);
    return {
      key: slugTrade(label) || `trade_${Math.random().toString(36).slice(2, 6)}`,
      label,
      sub_id: null,
      sub_snapshot: subToSnapshot(s),
      signature_status: "pending",
      doc_keys: [],
      ready: false,
      budgeted_fee_cents: 0,
      fee_confirmed: false,
    };
  });
  return {
    enabled: true,
    status: "draft",
    gc_fee_cents: 0,
    gc_license_number: FLORIDIAN_FIRM.licenseNumber,
    trades,
  };
}

export function newEmptyTrade(label: string, existingKeys: string[] = []): BundleTrade {
  const base = slugTrade(label) || `trade_${Math.random().toString(36).slice(2, 6)}`;
  let key = base;
  let i = 2;
  while (existingKeys.includes(key)) key = `${base}_${i++}`;
  return {
    key,
    label: label.trim() || "Trade",
    sub_id: null,
    sub_snapshot: null,
    signature_status: "pending",
    doc_keys: [],
    ready: false,
    budgeted_fee_cents: 0,
    fee_confirmed: false,
  };
}

export function bundleBudgetedTotal(b: Bundle | null | undefined): number {
  return (b?.trades ?? []).reduce((sum, t) => sum + (t.budgeted_fee_cents ?? 0), 0);
}

export function bundleAllFeesConfirmed(b: Bundle | null | undefined): boolean {
  const list = b?.trades ?? [];
  return list.length > 0 && list.every((t) => t.fee_confirmed);
}

export function getBundle(row: PermitRow | null | undefined): Bundle | null {
  const payload = (row?.intake_payload as PermitIntakePayload | null) ?? null;
  return payload?.bundle ?? null;
}

export function withBundle(row: PermitRow, next: Bundle): PermitIntakePayload {
  const base = (row.intake_payload as PermitIntakePayload | null) ?? {};
  return { ...base, bundle: next };
}

export type BundleProgress = {
  total: number;
  signed: number;
  sent: number;
  pending: number;
  percent: number;
  allSigned: boolean;
};

export function bundleProgress(b: Bundle | null | undefined): BundleProgress {
  const trades = b?.trades ?? [];
  const total = trades.length;
  const signed = trades.filter((t) => t.signature_status === "signed").length;
  const sent = trades.filter((t) => t.signature_status === "sent").length;
  const pending = total - signed - sent;
  return {
    total,
    signed,
    sent,
    pending,
    percent: total === 0 ? 0 : Math.round((signed / total) * 100),
    allSigned: total > 0 && signed === total,
  };
}

export type TradeRowStatus = "not_contacted" | "sent" | "signed_docs_missing" | "signed_complete";

export function tradeRowStatus(trade: BundleTrade, docs: PermitDoc[]): TradeRowStatus {
  if (trade.signature_status === "pending") return "not_contacted";
  if (trade.signature_status === "sent") return "sent";
  // signed
  const assigned = docs.filter((d) => trade.doc_keys.includes(d.key));
  const missing = assigned.some((d) => d.required && d.status !== "uploaded" && d.status !== "not_applicable");
  return missing || assigned.length === 0 ? "signed_docs_missing" : "signed_complete";
}

export type BundlePrefill = {
  project_address: string;
  municipality: string;
  permit_type: string;
  permit_number: string;
  trade: string;
  gc_name: string;
  gc_license: string;
  poc_name: string;
  poc_email: string;
  poc_phone: string;
};

export function buildBundlePrefill(row: PermitRow, trade: BundleTrade, bundle: Bundle): BundlePrefill {
  return {
    project_address: row.job_address,
    municipality: row.municipality ?? "",
    permit_type: row.permit_type ?? "",
    permit_number: row.permit_number ?? "",
    trade: trade.label,
    gc_name: "Flōridian",
    gc_license: bundle.gc_license_number || FLORIDIAN_FIRM.licenseNumber,
    poc_name: "José Maceda Gutiérrez",
    poc_email: "team@floridianinc.com",
    poc_phone: "(551) 830-6606",
  };
}
