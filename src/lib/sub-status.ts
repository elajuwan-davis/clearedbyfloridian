// Completeness + COI lifecycle for a live `subcontractors` row. Isolated from
// subs-api.ts so the rules can load under tsx without the Supabase client.
//
// The 30-day "expiring soon" window is what the roster, bid comparison, and
// compliance views use to turn a row amber. Invalid or missing dates are
// treated as missing — never as active.

export type SubStatusInput = {
  license_file_name?: string | null;
  license_expiration?: string | null;
  coi_file_name?: string | null;
  coi_expiration?: string | null;
  w9_file_name?: string | null;
};

export function subMissingFields(s: SubStatusInput): string[] {
  const out: string[] = [];
  if (!s.license_file_name) out.push("License Upload");
  if (!s.license_expiration) out.push("License Expiration");
  if (!s.coi_file_name) out.push("COI Upload");
  if (!s.coi_expiration) out.push("COI Expiration");
  if (!s.w9_file_name) out.push("W-9 Upload");
  return out;
}

export function subIsComplete(s: SubStatusInput): boolean {
  return subMissingFields(s).length === 0;
}

export function coiLifecycle(
  s: SubStatusInput,
  now: Date = new Date(),
): "active" | "expiring_soon" | "expired" | "missing" {
  if (!s.coi_expiration) return "missing";
  const exp = new Date(s.coi_expiration);
  if (isNaN(exp.getTime())) return "missing";
  const today = new Date(now.toDateString());
  const days = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring_soon";
  return "active";
}
