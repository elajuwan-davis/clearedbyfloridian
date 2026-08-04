// Stub of the Lovable AI gateway for local edge-function testing.
//
// The gateway needs LOVABLE_API_KEY, which only exists in the deployed project,
// so this stand-in serves the same /v1/chat/completions contract and lets the
// harness exercise everything around the model call: prompt assembly, JSON
// parsing, column writes, activity events. It intentionally does NOT judge
// output quality — that requires the real model.
//
//   deno run --allow-net --allow-env scripts/local-test/stub-ai-gateway.ts
//   AI_GATEWAY_URL=http://localhost:54332/v1/chat/completions

const PORT = Number(Deno.env.get("STUB_AI_PORT") ?? 54332);

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

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  if (!url.pathname.endsWith("/chat/completions")) {
    return new Response("not found", { status: 404 });
  }
  const body = await req.json();
  lastPrompt.system = body?.messages?.[0]?.content;
  lastPrompt.user = body?.messages?.[1]?.content;
  console.log("--- stub gateway received ---");
  console.log("model:", body?.model);
  console.log(lastPrompt.user);
  return Response.json({
    choices: [{ message: { role: "assistant", content: JSON.stringify(SCOPE_FIXTURE) } }],
  });
});
