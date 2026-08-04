import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  countNumberedComments,
  parsePlan,
  planTotals,
  userPrompt,
} from "./correction-parse.ts";

const validItem = {
  ordinal: 1,
  quoted_text: "Provide signed and sealed structural calculations for the canopy.",
  category: "plan",
  code_reference: "FBC, Building (8th Ed., 2023) § 1609",
  complexity: "high",
  estimated_hours: 6,
  fix_instruction: "Have the EOR seal wind-load calculations for the canopy and reissue S-101.",
  responsible_party: "engineer",
};

const plan = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    reviewer: "M. Alvarez",
    notice_date: "2026-07-30",
    resubmittal_due: "2026-08-14",
    items: [validItem],
    overall_complexity: "high",
    summary: "One structural comment requires the engineer of record.",
    acknowledgment: { subject: "Ack — 26BLD-004512", body: "We are addressing each comment." },
    ...over,
  });

Deno.test("parses a well-formed plan", () => {
  const p = parsePlan(plan());
  assertEquals(p.items.length, 1);
  assertEquals(p.items[0].category, "plan");
  assertEquals(p.resubmittal_due, "2026-08-14");
});

Deno.test("tolerates a fenced response and loose enum casing", () => {
  const p = parsePlan(
    "```json\n" +
      plan({ items: [{ ...validItem, category: "Code Compliance", complexity: "LOW" }] }) +
      "\n```",
  );
  assertEquals(p.items[0].category, "code_compliance");
  assertEquals(p.items[0].complexity, "low");
});

Deno.test("refuses an invented category", () => {
  assertThrows(
    () => parsePlan(plan({ items: [{ ...validItem, category: "structural" }] })),
    Error,
    "is not one of",
  );
});

Deno.test("refuses a plan with no items, no summary or no letter", () => {
  assertThrows(() => parsePlan(plan({ items: [] })), Error, "no correction items");
  assertThrows(() => parsePlan(plan({ summary: "  " })), Error, "no summary");
  assertThrows(
    () => parsePlan(plan({ acknowledgment: { subject: "x", body: "" } })),
    Error,
    "no acknowledgment letter",
  );
});

Deno.test("refuses an item that quotes nothing or fixes nothing", () => {
  assertThrows(
    () => parsePlan(plan({ items: [{ ...validItem, quoted_text: "" }] })),
    Error,
    "quotes nothing",
  );
  assertThrows(
    () => parsePlan(plan({ items: [{ ...validItem, fix_instruction: " " }] })),
    Error,
    "no fix instruction",
  );
});

Deno.test("drops an unusable code reference, date or estimate instead of guessing", () => {
  const p = parsePlan(
    plan({
      notice_date: "July 30, 2026",
      items: [{ ...validItem, code_reference: "none", estimated_hours: "unknown" }],
    }),
  );
  assertEquals(p.notice_date, null);
  assertEquals(p.items[0].code_reference, null);
  assertEquals(p.items[0].estimated_hours, null);
});

Deno.test("totals are computed here, not asked of the model", () => {
  const p = parsePlan(
    plan({
      items: [
        validItem,
        { ...validItem, ordinal: 2, category: "fee", complexity: "low", estimated_hours: null,
          responsible_party: "gc" },
      ],
    }),
  );
  const t = planTotals(p);
  assertEquals(t.item_count, 2);
  assertEquals(t.by_category, { plan: 1, fee: 1 });
  assertEquals(t.estimated_hours, 6);
  assertEquals(t.items_without_estimate, 1);
  assertEquals(t.third_party_items, 1);
});

Deno.test("items are ordered by the letter's numbering", () => {
  const p = parsePlan(
    plan({
      items: [
        { ...validItem, ordinal: 3 },
        { ...validItem, ordinal: 1 },
      ],
    }),
  );
  assertEquals(
    p.items.map((i) => i.ordinal),
    [1, 3],
  );
});

Deno.test("counts the letter's own numbered comments", () => {
  const letter = `PLAN REVIEW COMMENTS
1. Provide a signed and sealed truss layout.
2) Site plan is missing the setback dimensions.
Comment 3 - Pay the outstanding plan review fee of $412.00.
Sheet A-101 shows a 3' door.`;
  assertEquals(countNumberedComments(letter), 3);
  assertEquals(countNumberedComments("No numbering at all in this letter."), 0);
});

Deno.test("prompt carries the letter verbatim and omits unknown context", () => {
  const p = userPrompt({
    municipality: "Plantation",
    permit_label: null,
    job_address: null,
    record_number: "26BLD-004512",
    notice_label: "Plan Review Comments (2)",
    letter_text: "1. Provide the NOC.",
  });
  assertEquals(p.includes("1. Provide the NOC."), true);
  assertEquals(p.includes("Project:"), false);
});
