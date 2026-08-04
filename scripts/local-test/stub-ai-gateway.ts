// Local stand-in for the Lovable AI gateway, so the corrections pipeline can be exercised
// without a LOVABLE_API_KEY. It is NOT a model: it reads the letter out of the prompt it was
// given and answers with a plan quoting that letter's own numbered comments, which is exactly
// what the real model is instructed to do. That makes it useful for two things the model
// cannot be relied on to demonstrate: that letter-specific content survives the whole
// pipeline unaltered, and that the strict validator rejects a bad answer.
//
//   deno run --allow-net --allow-env scripts/local-test/stub-ai-gateway.ts     # :8300
//
// STUB_MODE:
//   plan     (default) a valid plan built from the letter's numbered comments
//   invalid  a plan with an invented category — parsePlan must refuse it
//   prose    not JSON at all — parsePlan must refuse it

const PORT = Number(Deno.env.get("PORT") ?? 8300);
const MODE = Deno.env.get("STUB_MODE") ?? "plan";

const CATEGORY_HINTS: Array<[RegExp, string, string]> = [
  [/fee|\$\d/i, "fee", "cleard"],
  [/calculation|sealed|signed and sealed|structural/i, "plan", "engineer"],
  [/dimension|sheet [A-Z]-\d|floor plan|egress/i, "plan", "architect"],
  [/notice of commencement|recorded|record/i, "documentation", "owner"],
  [/qualifier|license|application/i, "administrative", "gc"],
  [/form|unsigned|submit a copy|submit the corrected/i, "documentation", "gc"],
  [/FBC|F\.S\.|code|section \d/i, "code_compliance", "gc"],
];

function splitComments(letter: string): string[] {
  const lines = letter.split(/\n/);
  const items: string[] = [];
  let current: string[] | null = null;
  for (const line of lines) {
    if (/^\s*\d+[.)]\s/.test(line)) {
      if (current) items.push(current.join(" ").trim());
      current = [line.replace(/^\s*\d+[.)]\s*/, "")];
    } else if (current && line.trim() && !/^[A-Z][a-z]+ [A-Z]/.test(line.trim())) {
      current.push(line.trim());
    } else if (current && !line.trim()) {
      items.push(current.join(" ").trim());
      current = null;
    }
  }
  if (current) items.push(current.join(" ").trim());
  return items.filter((t) => t.length > 15);
}

function classify(text: string): { category: string; party: string } {
  for (const [re, category, party] of CATEGORY_HINTS) {
    if (re.test(text)) return { category, party };
  }
  return { category: "administrative", party: "cleard" };
}

function codeRef(text: string): string | null {
  const m = text.match(/(FBC[^.]*?\d[\d.]*)|(F\.S\.\s*\d+\.\d+(\(\d+\))?(\([a-z]\))?)/i);
  return m ? m[0].trim() : null;
}

function isoDate(text: string | undefined): string | null {
  if (!text) return null;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function buildPlan(prompt: string) {
  const marker = prompt.indexOf("Correction letter, verbatim:");
  const letter = marker >= 0 ? prompt.slice(marker) : prompt;
  const comments = splitComments(letter);
  const items = comments.map((quoted, i) => {
    const { category, party } = classify(quoted);
    const heavy = category === "plan";
    return {
      ordinal: i + 1,
      quoted_text: quoted,
      category,
      code_reference: codeRef(quoted),
      complexity: heavy ? "high" : category === "fee" ? "low" : "medium",
      estimated_hours: heavy ? 6 : category === "fee" ? 0.5 : 2,
      fix_instruction: `Address comment ${i + 1}: ${quoted.slice(0, 120)}`,
      responsible_party: party,
    };
  });
  const record = prompt.match(/Permit\/record number:\s*(\S+)/)?.[1] ?? "the record";
  return {
    reviewer: prompt.match(/Reviewer:\s*([^\n,]+)/)?.[1]?.trim() ?? null,
    notice_date: null,
    resubmittal_due: isoDate(letter.match(/Resubmittal Due:\s*([A-Za-z]+ \d{1,2},? \d{4})/)?.[1]),
    items,
    overall_complexity: items.some((i) => i.complexity === "high") ? "high" : "medium",
    summary: `${items.length} plan review comment(s) on ${record}, spanning ${
      new Set(items.map((i) => i.category)).size
    } categor(y/ies).`,
    acknowledgment: {
      subject: `Acknowledgment of plan review comments — ${record}`,
      body:
        `We have received the plan review comments for ${record} and are addressing each of the ` +
        `${items.length} comment(s). A written response and revised documents will be resubmitted ` +
        `through the Citizen Access portal.`,
    },
  };
}

Deno.serve({ port: PORT }, async (req) => {
  const body = (await req.json().catch(() => ({}))) as {
    model?: string;
    messages?: Array<{ role: string; content: string }>;
  };
  const prompt = body.messages?.find((m) => m.role === "user")?.content ?? "";

  let content: string;
  if (MODE === "prose") {
    content = "The letter asks for a few revisions. I would fix the plans.";
  } else if (MODE === "invalid") {
    const plan = buildPlan(prompt);
    plan.items[0].category = "structural";
    content = JSON.stringify(plan);
  } else {
    content = "```json\n" + JSON.stringify(buildPlan(prompt), null, 2) + "\n```";
  }

  return Response.json({
    model: body.model ?? "stub",
    choices: [{ message: { role: "assistant", content } }],
  });
});

console.log(`stub AI gateway on :${PORT} (mode=${MODE})`);
