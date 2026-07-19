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
  | "pending";

export const projectStatusMeta: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  submitted: { label: "Submitted", tone: "sky" },
  in_review: { label: "In review", tone: "amber" },
  corrections_required: { label: "Corrections required", tone: "oxblood" },
  correction_response_under_review: { label: "Response under review", tone: "amber" },
  resubmitted: { label: "Resubmitted", tone: "amber" },
  resubmitted_to_county: { label: "Resubmitted", tone: "amber" },
  approved: { label: "Approved", tone: "emerald" },
  inspection_scheduled: { label: "Inspection scheduled", tone: "amber" },
  inspection_complete: { label: "Inspection complete", tone: "emerald" },
  permit_issued: { label: "Permit issued", tone: "dark" },
  on_hold: { label: "On hold", tone: "oxblood" },
  pending: { label: "Pending", tone: "neutral" },
};

export type FeeStatus = "pending" | "invoiced" | "paid" | "overdue" | "refunded";

export const feeStatusMeta: Record<FeeStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  invoiced: { label: "Invoiced", tone: "sky" },
  paid: { label: "Paid", tone: "emerald" },
  overdue: { label: "Overdue", tone: "oxblood" },
  refunded: { label: "Refunded", tone: "neutral" },
};
