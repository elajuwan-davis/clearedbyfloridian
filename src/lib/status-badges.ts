// Canonical status badge tones — used by /projects, /projects/$id, /admin, /dashboard
// blue=sky, yellow=amber, red=oxblood, green=emerald, obsidian+white=dark, gray=neutral

export type BadgeTone = "sky" | "amber" | "oxblood" | "emerald" | "dark" | "neutral";

export const toneClass: Record<BadgeTone, string> = {
  sky: "bg-sky/10 text-sky border-sky/30",
  amber: "bg-amber-500/10 text-amber-700 border-amber-600/30",
  oxblood: "bg-oxblood/10 text-oxblood border-oxblood/30",
  emerald: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
  dark: "bg-obsidian text-paper-warm border-obsidian",
  neutral: "bg-paper-warm text-obsidian/65 border-obsidian/15",
};

export type ProjectStatus =
  | "submitted"
  | "in_review"
  | "corrections_required"
  | "correction_response_under_review"
  | "resubmitted"
  | "resubmitted_to_county"
  | "approved"
  | "inspection_scheduled"
  | "inspection_complete"
  | "permit_issued"
  | "on_hold"
  | "outsourced_permitting"
  | "pending";

export const projectStatusMeta: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  submitted: { label: "Pre-Check", tone: "sky" },
  in_review: { label: "Pre-Check", tone: "amber" },
  corrections_required: { label: "Delayed", tone: "oxblood" },
  correction_response_under_review: { label: "Cleared for Takeoff", tone: "amber" },
  resubmitted: { label: "Cleared for Takeoff", tone: "amber" },
  resubmitted_to_county: { label: "Cleared for Takeoff", tone: "amber" },
  approved: { label: "Cleared for Takeoff", tone: "emerald" },
  inspection_scheduled: { label: "En Route", tone: "amber" },
  inspection_complete: { label: "Arrival", tone: "emerald" },
  permit_issued: { label: "En Route", tone: "dark" },
  on_hold: { label: "Delayed", tone: "oxblood" },
  outsourced_permitting: { label: "Outsourced permitting", tone: "neutral" },
  pending: { label: "Pre-Check", tone: "neutral" },
};

export type FeeStatus = "pending" | "invoiced" | "paid" | "overdue" | "refunded";

export const feeStatusMeta: Record<FeeStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  invoiced: { label: "Invoiced", tone: "sky" },
  paid: { label: "Paid", tone: "emerald" },
  overdue: { label: "Overdue", tone: "oxblood" },
  refunded: { label: "Refunded", tone: "neutral" },
};
