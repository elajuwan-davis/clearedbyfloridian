// Agent 7 — turning a building department's correction letter into a reviewable plan.
//
// The model categorises and drafts; this module decides what is acceptable. Categories,
// complexity and responsible party are closed sets, item text must come back non-empty, and
// an acknowledgment letter with no items behind it is rejected — so a vague or hallucinated
// response fails loudly instead of being posted to staff as if it were a real plan.
//
// The closed sets below are mirrored — not imported — by src/lib/corrections.ts, because the
// browser bundle cannot import from an edge function. Adding a category, complexity or party
// here does not propagate: change both files, or the UI will render a value it has no label
// for while validation happily accepts it.

export const CATEGORIES = [
  "documentation",
  "plan",
  "code_compliance",
  "fee",
  "administrative",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const COMPLEXITIES = ["low", "medium", "high"] as const;
export type Complexity = (typeof COMPLEXITIES)[number];

export const PARTIES = ["cleard", "gc", "engineer", "architect", "owner"] as const;
export type Party = (typeof PARTIES)[number];

export type CorrectionItem = {
  ordinal: number;
  quoted_text: string;
  category: Category;
  code_reference: string | null;
  complexity: Complexity;
  estimated_hours: number | null;
  fix_instruction: string;
  responsible_party: Party;
};

export type CorrectionPlan = {
  reviewer: string | null;
  notice_date: string | null;
  resubmittal_due: string | null;
  items: CorrectionItem[];
  overall_complexity: Complexity;
  summary: string;
  acknowledgment: { subject: string; body: string };
};

export const SYSTEM_PROMPT = `You read plan-review correction letters from Florida building
departments and turn them into a work plan for a private provider firm (Cleard) that files
permits on behalf of general contractors.

Rules:
- Work only from the letter. Every item you list must correspond to something the letter
  actually says; quote it. Never merge two comments into one item, never invent an item, and
  never drop one because it looks minor.
- Categorise each item exactly one of: documentation (a missing or unsigned document),
  plan (a drawing must change), code_compliance (the design conflicts with a code
  requirement), fee (money owed), administrative (contact info, form fields, portal steps).
- code_reference: the code section the letter itself cites, verbatim (e.g. "FBC, Building
  (8th Ed., 2023) § 1609.1.1"). null if the letter cites none — do not supply one yourself.
- complexity: low = a document or field is produced/corrected with no design work;
  medium = a drawing revision or a calculation; high = a design change, a new engineered
  document, or anything needing a sealed revision.
- estimated_hours: your estimate of the work for that item, or null if the letter is too
  vague to estimate. Do not pad.
- fix_instruction: what Cleard or the GC must actually do, specific to this item, in the
  imperative. Not a restatement of the comment.
- responsible_party: cleard, gc, engineer, architect or owner — whoever must produce the fix.
- The acknowledgment letter is addressed to the building department, from Cleard, and is
  professional and short: confirm receipt, state that each comment is being addressed, name
  the items that need third-party work if any, and commit to a resubmittal. It must not
  promise a date the letter does not require, must not argue with a comment, and must not
  claim anything has already been fixed.

Return strict JSON only, no code fence:
{
  "reviewer": "plans examiner name if stated, else null",
  "notice_date": "YYYY-MM-DD if stated, else null",
  "resubmittal_due": "YYYY-MM-DD if the letter states a deadline, else null",
  "items": [
    {
      "ordinal": 1,
      "quoted_text": "the comment, quoted from the letter",
      "category": "plan",
      "code_reference": "FBC, Building § 1609" ,
      "complexity": "medium",
      "estimated_hours": 3,
      "fix_instruction": "...",
      "responsible_party": "engineer"
    }
  ],
  "overall_complexity": "medium",
  "summary": "two or three sentences a staff member can act on",
  "acknowledgment": { "subject": "...", "body": "..." }
}`;

export type LetterContext = {
  municipality: string | null;
  permit_label: string | null;
  job_address: string | null;
  record_number: string | null;
  notice_label: string | null;
  letter_text: string;
};

export function userPrompt(ctx: LetterContext): string {
  return [
    `Building department: ${ctx.municipality ?? "unspecified"}, Florida`,
    ctx.record_number ? `Permit/record number: ${ctx.record_number}` : null,
    ctx.permit_label ? `Project: ${ctx.permit_label}` : null,
    ctx.job_address ? `Property: ${ctx.job_address}` : null,
    ctx.notice_label ? `Notice: ${ctx.notice_label}` : null,
    "",
    "Correction letter, verbatim:",
    ctx.letter_text,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

function one<T extends string>(allowed: readonly T[], value: unknown, field: string): T {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const hit = allowed.find((a) => a === v);
  if (!hit) throw new Error(`${field} "${value}" is not one of ${allowed.join(", ")}`);
  return hit;
}

function optionalDate(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (!s || s.toLowerCase() === "null") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10) / 10;
}

function optionalText(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "none") return null;
  return s;
}

/** Parses and validates the model's JSON. Throws rather than returning a partial plan. */
export function parsePlan(content: string): CorrectionPlan {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Prose instead of a plan: refused outright rather than salvaged into a half checklist.
    throw new Error(`model did not return a JSON plan: ${cleaned.slice(0, 120)}`);
  }

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  if (rawItems.length === 0) throw new Error("model returned no correction items");

  const items: CorrectionItem[] = rawItems.map((entry, i) => {
    const it = (entry ?? {}) as Record<string, unknown>;
    const quoted = String(it.quoted_text ?? "").trim();
    const fix = String(it.fix_instruction ?? "").trim();
    if (!quoted) throw new Error(`item ${i + 1} quotes nothing from the letter`);
    if (!fix) throw new Error(`item ${i + 1} has no fix instruction`);
    return {
      ordinal: Number.isFinite(Number(it.ordinal)) ? Number(it.ordinal) : i + 1,
      quoted_text: quoted,
      category: one(CATEGORIES, it.category, `item ${i + 1} category`),
      code_reference: optionalText(it.code_reference),
      complexity: one(COMPLEXITIES, it.complexity, `item ${i + 1} complexity`),
      estimated_hours: optionalNumber(it.estimated_hours),
      fix_instruction: fix,
      responsible_party: one(PARTIES, it.responsible_party, `item ${i + 1} responsible party`),
    };
  });

  const ack = (raw.acknowledgment ?? {}) as Record<string, unknown>;
  const subject = String(ack.subject ?? "").trim();
  const body = String(ack.body ?? "").trim();
  if (!subject || !body) throw new Error("model returned no acknowledgment letter");

  const summary = String(raw.summary ?? "").trim();
  if (!summary) throw new Error("model returned no summary");

  return {
    reviewer: optionalText(raw.reviewer),
    notice_date: optionalDate(raw.notice_date),
    resubmittal_due: optionalDate(raw.resubmittal_due),
    items: items.sort((a, b) => a.ordinal - b.ordinal),
    overall_complexity: one(COMPLEXITIES, raw.overall_complexity, "overall complexity"),
    summary,
    acknowledgment: { subject, body },
  };
}

/** Deterministic rollup staff read before approving; not asked of the model. */
export function planTotals(plan: CorrectionPlan) {
  const byCategory: Record<string, number> = {};
  for (const item of plan.items) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
  }
  const hours = plan.items.reduce((sum, i) => sum + (i.estimated_hours ?? 0), 0);
  return {
    item_count: plan.items.length,
    by_category: byCategory,
    estimated_hours: Math.round(hours * 10) / 10,
    items_without_estimate: plan.items.filter((i) => i.estimated_hours === null).length,
    third_party_items: plan.items.filter((i) =>
      ["engineer", "architect"].includes(i.responsible_party),
    ).length,
  };
}

/**
 * Splits a letter into its numbered comments. Used to check the model against the letter:
 * if the letter numbers 6 comments and the plan has 4, staff are told before approving.
 */
export function countNumberedComments(letterText: string): number {
  const matches = letterText.match(/^\s*(?:\d{1,2}[.)]|comment\s+\d{1,2}\b)/gim);
  if (!matches) return 0;
  return new Set(matches.map((m) => m.replace(/\D/g, ""))).size;
}
