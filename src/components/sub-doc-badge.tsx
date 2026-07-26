// Traffic-light badge for subcontractor document validity (COI / License).
// Green = >30 days remaining. Yellow = within 30 days. Red = expired.

type BadgeState = "valid" | "warning" | "expired" | "unknown";

export function docBadgeState(expiration: string | null | undefined): BadgeState {
  if (!expiration) return "unknown";
  const d = new Date(expiration);
  if (isNaN(d.getTime())) return "unknown";
  const days = Math.floor((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return "expired";
  if (days <= 30) return "warning";
  return "valid";
}

const CLASSES: Record<BadgeState, string> = {
  valid: "border-emerald-600/40 bg-emerald-50 text-emerald-800",
  warning: "border-amber-500/40 bg-amber-50 text-amber-900",
  expired: "border-red-500/40 bg-red-50 text-red-900",
  unknown: "border-obsidian/20 bg-obsidian/5 text-obsidian/60",
};

const LABELS: Record<BadgeState, string> = {
  valid: "Valid",
  warning: "Expiring Soon",
  expired: "Expired",
  unknown: "No Date",
};

export function SubDocBadge({ label, expiration }: { label: string; expiration: string | null | undefined }) {
  const state = docBadgeState(expiration);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-[3px] text-[10px] font-mono uppercase tracking-[0.14em] ${CLASSES[state]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        state === "valid" ? "bg-emerald-600" : state === "warning" ? "bg-amber-500" : state === "expired" ? "bg-red-600" : "bg-obsidian/40"
      }`} />
      {label} · {LABELS[state]}{expiration ? ` · ${expiration}` : ""}
    </span>
  );
}
