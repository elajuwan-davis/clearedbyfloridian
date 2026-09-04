// Canonical status badge tones — lucid semantic colors across portal + marketing.
// sky/info = blue (draft / submitted / in progress)
// amber = warning / review
// oxblood = danger / corrections / hold
// emerald = success / issued / approved
// dark/neutral = quiet metadata

export type BadgeTone = "sky" | "amber" | "oxblood" | "emerald" | "dark" | "neutral";

export const toneClass: Record<BadgeTone, string> = {
  sky: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  oxblood: "bg-red-50 text-red-800 border-red-200",
  emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
  dark: "bg-obsidian text-white border-obsidian",
  neutral: "bg-[color:var(--gray-bg)] text-[color:var(--text-2)] border-[color:var(--line)]",
};

/** Map BadgeTone → portal chip class (StatusChip / p-chip-*). */
export const toneToChip: Record<BadgeTone, string> = {
  sky: "p-chip-info",
  amber: "p-chip-warning",
  oxblood: "p-chip-danger",
  emerald: "p-chip-success",
  dark: "p-chip-neutral",
  neutral: "p-chip-neutral",
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
  | "pending"
  | "draft";

export const projectStatusMeta: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "sky" },
  submitted: { label: "Submitted", tone: "sky" },
  pending: { label: "Pending", tone: "neutral" },
  in_review: { label: "In Review", tone: "amber" },
  corrections_required: { label: "Corrections", tone: "oxblood" },
  correction_response_under_review: { label: "Response in Review", tone: "amber" },
  resubmitted: { label: "Resubmitted", tone: "sky" },
  resubmitted_to_county: { label: "Resubmitted", tone: "sky" },
  approved: { label: "Approved", tone: "emerald" },
  inspection_scheduled: { label: "Inspection Scheduled", tone: "amber" },
  inspection_complete: { label: "Inspection Complete", tone: "emerald" },
  permit_issued: { label: "Issued", tone: "emerald" },
  on_hold: { label: "On Hold", tone: "oxblood" },
  outsourced_permitting: { label: "Outsourced", tone: "neutral" },
};

export type FeeStatus = "pending" | "invoiced" | "paid" | "overdue" | "refunded";

export const feeStatusMeta: Record<FeeStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "neutral" },
  invoiced: { label: "Invoiced", tone: "sky" },
  paid: { label: "Paid", tone: "emerald" },
  overdue: { label: "Overdue", tone: "oxblood" },
  refunded: { label: "Refunded", tone: "neutral" },
};
