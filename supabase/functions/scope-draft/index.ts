// Agent 3 — Scope Draft.
//
// Two entry points, one function:
//   1. trg_permits_scope_draft (permit turned green) → { permit_id }
//   2. the intake form's "Draft formal scope" button → { description, municipality,
//      permit_type, ... } with no permit_id, which returns drafts without writing.
//
// Independent of Agent 2 — it reads nothing Agent 2 produces and writes only the
// scope_* columns.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { aiConfigured, chat, envFromDeno } from "../_shared/ai.ts";
import { errorMessage } from "../_shared/errors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Provider (Anthropic direct vs Lovable's gateway) is resolved per call in _shared/ai.ts;
// AI_GATEWAY_URL still exists so the local harness can point at a stub gateway.
const MODEL = Deno.env.get("SCOPE_DRAFT_MODEL") ?? "anthropic/claude-sonnet-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const SYSTEM_PROMPT = `You write the "scope of work" narrative on Florida building permit
applications. You are drafting for a private provider firm that submits to Florida building
departments, so the language must read like the permit application itself, not like a summary of
what the contractor said.

Rules:
- Write in the register a plans examiner expects: third person, present tense, declarative,
  no marketing adjectives, no "the client wants", no bullet-point fragments in the concise version.
- Lead with the permit-relevant action and the structure/system affected, then location on the
  property, then quantities (square footage, linear feet, counts, capacities) whenever the source
  text supports them. Never invent a quantity that is not in the source text.
- Name the trades that require their own sub-permits (electrical, plumbing, mechanical, gas, roofing)
  explicitly, because the department uses this text to decide which sub-permits to require.
- Cite the governing code sections when the work clearly implicates them, using the correct short
  form: "FBC, Building (8th Ed., 2023) § 1609" for structural/wind load, "FBC, Residential § R507"
  for decks, "FBC, Existing Building § 502" for level 1 alterations, "NEC (NFPA 70) Art. 680" for
  pool electrical, "FBC, Building § 454.2" / "FBC, Residential § R4501" for swimming pools,
  "FBC, Plumbing § 305" for plumbing, "FBC, Mechanical § 301" for mechanical, "FBC, Energy
  Conservation § R405" for energy compliance, "Florida Statute § 553.791" for private provider
  review, "Florida Statute § 713.13" for the notice of commencement. Cite only what the described
  work actually implicates; a wrong citation is worse than none.
- If the source text is vague on something a plans examiner must know, do not guess: end the
  detailed version with a line beginning "Information required to complete this scope:" listing
  the missing items.
- Never restate the contractor's sentence with synonyms. Restructure it into application language.

Return strict JSON only, no code fence:
{
  "concise": "one or two sentences, <= 300 characters, suitable for the application's scope field",
  "detailed": "3-6 short paragraphs of formal scope language, code citations inline",
  "code_sections": ["FBC, Residential § R507", ...],
  "sub_permits": ["electrical", ...],
  "missing_information": ["...", ...]
}`;

type Draft = {
  concise: string;
  detailed: string;
  code_sections: string[];
  sub_permits: string[];
  missing_information: string[];
};

type Source = {
  tenant_id?: string | null;
  description: string;
  project_name?: string | null;
  permit_type?: string | null;
  municipality?: string | null;
  county?: string | null;
  job_address?: string | null;
  construction_value_cents?: number | null;
  additional_notes?: string | null;
};

function userPrompt(src: Source): string {
  const lines = [
    `Jurisdiction: ${src.municipality || "unspecified"}${src.county ? `, ${src.county}` : ""}, Florida`,
    `Permit type as selected by the contractor: ${src.permit_type || "unspecified"}`,
    src.project_name ? `Project name: ${src.project_name}` : null,
    src.job_address ? `Property: ${src.job_address}` : null,
    src.construction_value_cents
      ? `Declared construction value: $${(src.construction_value_cents / 100).toLocaleString("en-US")}`
      : null,
    "",
    "Contractor's own words (verbatim, may be messy):",
    src.description,
    src.additional_notes ? `\nAdditional contractor notes:\n${src.additional_notes}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function parseDraft(content: string): Draft {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const raw = JSON.parse(cleaned) as Partial<Draft>;
  if (!raw.concise || !raw.detailed) throw new Error("model returned no scope text");
  return {
    concise: String(raw.concise).trim(),
    detailed: String(raw.detailed).trim(),
    code_sections: Array.isArray(raw.code_sections) ? raw.code_sections.map(String) : [],
    sub_permits: Array.isArray(raw.sub_permits) ? raw.sub_permits.map(String) : [],
    missing_information: Array.isArray(raw.missing_information)
      ? raw.missing_information.map(String)
      : [],
  };
}

async function draftScope(src: Source): Promise<Draft> {
  if (!aiConfigured()) throw new Error("no AI provider configured — cannot draft a scope");
  const { text } = await chat(
    {
      model: MODEL,
      system: SYSTEM_PROMPT,
      user: userPrompt(src),
      temperature: 0.2,
      maxTokens: 2048,
    },
    envFromDeno(),
  );
  return parseDraft(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      permit_id?: string;
      description?: string;
      project_name?: string;
      permit_type?: string;
      municipality?: string;
      county?: string;
      job_address?: string;
    };

    let src: Source | null = null;
    const permitId: string | null = body.permit_id ?? null;

    if (permitId) {
      const { data: permit, error } = await admin
        .from("permits")
        .select(
          "id, tenant_id, project_name, description, additional_notes, permit_type, municipality, county, job_address, construction_value_cents",
        )
        .eq("id", permitId)
        .maybeSingle();
      if (error) throw error;
      if (!permit) return json({ error: "permit not found" }, 404);
      src = permit as Source;
    } else if (body.description) {
      // On-demand from the intake form, before the permit row exists.
      src = {
        description: body.description,
        project_name: body.project_name ?? null,
        permit_type: body.permit_type ?? null,
        municipality: body.municipality ?? null,
        county: body.county ?? null,
        job_address: body.job_address ?? null,
      };
    } else {
      return json({ error: "permit_id or description required" }, 400);
    }

    const description = (src.description ?? "").trim();
    if (description.length < 12) {
      return json(
        { error: "description too short to draft a scope", description_length: description.length },
        422,
      );
    }

    const draft = await draftScope(src);

    if (permitId) {
      const meta = {
        model: MODEL,
        drafted_at: new Date().toISOString(),
        source_description: description,
        code_sections: draft.code_sections,
        sub_permits: draft.sub_permits,
        missing_information: draft.missing_information,
      };
      const { error: upErr } = await admin
        .from("permits")
        .update({
          scope_concise: draft.concise,
          scope_detailed: draft.detailed,
          scope_drafted_at: meta.drafted_at,
          scope_draft_meta: meta,
        })
        .eq("id", permitId);
      if (upErr) throw upErr;

      await admin.from("activity_events").insert({
        tenant_id: src.tenant_id ?? null,
        permit_id: permitId,
        event_type: "scope_drafted",
        actor_label: "Cleard automation",
        summary: `Drafted formal permit scope (${draft.code_sections.length} code citation(s))`,
        details: meta,
      });
    }

    return json({ permit_id: permitId, persisted: Boolean(permitId), ...draft });
  } catch (err) {
    console.error("scope-draft failed", err);
    return json({ error: errorMessage(err) }, 500);
  }
});
