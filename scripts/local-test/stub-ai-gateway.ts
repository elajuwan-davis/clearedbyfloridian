// Stub of the Lovable AI gateway for local edge-function testing.
//
// Covers both the scope-draft fixture (deterministic JSON) and the corrections
// parser (letter-echo plan). LOVABLE_API_KEY only exists in the deployed
// project, so this stand-in serves /v1/chat/completions and lets the harness
// exercise prompt assembly, JSON parsing, column writes, and activity events.
// It intentionally does NOT judge model quality.
//
//   deno run --allow-net --allow-env scripts/local-test/stub-ai-gateway.ts
//   AI_GATEWAY_URL=http://localhost:54332/v1/chat/completions   # scope-draft
//   AI_GATEWAY_URL=http://localhost:8300/v1/chat/completions    # agent 7 (PORT=8300)
//
// STUB_MODE (corrections prompts only):
//   plan     (default) a valid plan built from the letter's numbered comments
//   invalid  a plan with an invented category — parsePlan must refuse it
//   prose    not JSON at all — parsePlan must refuse it

const PORT = Number(Deno.env.get("PORT") ?? Deno.env.get("STUB_AI_PORT") ?? 54332);
const MODE = Deno.env.get("STUB_MODE") ?? "plan";

/** Recorded so a test can assert what the function actually sent. */
export const lastPrompt: { system?: string; user?: string } = {};

const SCOPE_FIXTURE = {
  concise:
    "Construct a 480 square foot elevated roof deck with an attached pergola over the existing " +
    "third-floor structure, including associated branch circuits and exterior luminaires.",
  detailed: [
    "Scope of work: construction of a 480 square foot elevated roof deck over the existing " +
      "third-floor roof structure, with an attached open pergola. Framing, connections and uplift " +
      "resistance to be designed to the wind loads of FBC, Building (8th Ed., 2023) § 1609 for the " +
      "site's risk category and exposure.",
    "The existing roof assembly and supporting members are altered to receive the new deck loads; " +
      "the alteration is a Level 1 alteration under FBC, Existing Building § 502 and requires " +
      "sealed structural documents from the engineer of record.",
    "Electrical: new branch circuits, weather-resistant receptacles and exterior luminaires serving " +
      "the deck, installed per NEC (NFPA 70). Electrical work is performed under a separate " +
      "electrical sub-permit.",
    "Information required to complete this scope: guardrail height and infill detail, and whether " +
      "the pergola is freestanding or attached to the parapet.",
  ].join("\n\n"),
  code_sections: [
    "FBC, Building (8th Ed., 2023) § 1609",
    "FBC, Existing Building § 502",
    "NEC (NFPA 70)",
  ],
  sub_permits: ["electrical"],
  missing_information: [
    "Guardrail height and infill detail",
    "Pergola attachment: freestanding or attached to parapet",
  ],
};

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

function isCorrectionsPrompt(prompt: string): boolean {
  return (
    prompt.includes("Correction letter, verbatim:") ||
    prompt.includes("plan review comment") ||
    /numbered comments/i.test(prompt)
  );
}

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  if (url.pathname !== "/" && !url.pathname.endsWith("/chat/completions")) {
    return new Response("not found", { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    model?: string;
    messages?: Array<{ role: string; content: string }>;
  };
  lastPrompt.system = body.messages?.[0]?.content;
  lastPrompt.user =
    body.messages?.[1]?.content ?? body.messages?.find((m) => m.role === "user")?.content;
  const prompt = lastPrompt.user ?? "";

  console.log("--- stub gateway received ---");
  console.log("model:", body.model);
  console.log("mode:", isCorrectionsPrompt(prompt) ? `corrections/${MODE}` : "scope");

  if (isCorrectionsPrompt(prompt)) {
    let content: string;
    if (MODE === "prose") {
      content = "The letter asks for a few revisions. I would fix the plans.";
    } else if (MODE === "invalid") {
      const plan = buildPlan(prompt);
      if (plan.items[0]) plan.items[0].category = "structural";
      content = JSON.stringify(plan);
    } else {
      content = "```json\n" + JSON.stringify(buildPlan(prompt), null, 2) + "\n```";
    }
    return Response.json({
      model: body.model ?? "stub",
      choices: [{ message: { role: "assistant", content } }],
    });
  }

  return Response.json({
    choices: [{ message: { role: "assistant", content: JSON.stringify(SCOPE_FIXTURE) } }],
  });
});

console.log(`stub AI gateway on :${PORT} (STUB_MODE=${MODE})`);
