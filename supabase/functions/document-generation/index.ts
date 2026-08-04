// Agent 2 — Document Generation.
//
// Invoked by trg_permits_document_generation when a permit's validation_status
// turns green (Agent 1), or directly with { permit_id }.
//
// Pulls the jurisdiction's required-form checklist, fills each generatable form
// from form_field_mappings, reuses the project's existing PDF generators
// (_shared/nto-pdf.ts, _shared/private-provider-forms.ts — vendored copies of the
// src/lib originals, nothing rebuilt here),
// merges everything into one bundle in the permit-files bucket, logs an
// activity_event, and notifies staff about anything it could not fill.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { PDFDocument } from "pdf-lib";
import { buildNtoPdfBytes } from "../_shared/nto-pdf.ts";
import { generateOwnerAuth, generateNTBO } from "../_shared/private-provider-forms.ts";
import { getChecklist } from "../_shared/permit-checklists.ts";
import { FLORIDIAN_FIRM } from "../_shared/floridian-firm.ts";
import { errorMessage } from "../_shared/errors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BUCKET = Deno.env.get("PERMIT_BUCKET") ?? "permit-files";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type Json = Record<string, unknown>;

/** Which checklist keys this function can actually produce, and how. */
const GENERATORS: Record<string, { formType: string; label: string }> = {
  notice_to_owner: { formType: "nto", label: "Notice to Owner" },
  nto: { formType: "nto", label: "Notice to Owner" },
  owner_authorization: { formType: "owner_authorization", label: "Owner Authorization" },
  private_provider_owner_authorization: {
    formType: "owner_authorization",
    label: "Owner Authorization",
  },
  ntbo: { formType: "ntbo", label: "Notice to Building Official" },
  notice_to_building_official: { formType: "ntbo", label: "Notice to Building Official" },
};

// ---------------------------------------------------------------------------
// mapping engine
// ---------------------------------------------------------------------------

type Mapping = {
  jurisdiction: string;
  form_type: string;
  source_field: string;
  target_field: string;
  required: boolean;
  fallback_value: string | null;
};

function pick(ctx: Json, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Json)[part];
    return undefined;
  }, ctx);
}

/** Municipality-specific rows win over the '*' defaults for the same target. */
function resolveMappings(rows: Mapping[], jurisdiction: string, formType: string): Mapping[] {
  const juris = jurisdiction.trim().toLowerCase();
  const forForm = rows.filter((r) => r.form_type === formType);
  const byTarget = new Map<string, Mapping>();
  for (const r of forForm.filter((r) => r.jurisdiction === "*")) byTarget.set(r.target_field, r);
  for (const r of forForm.filter((r) => r.jurisdiction.trim().toLowerCase() === juris)) {
    byTarget.set(r.target_field, r);
  }
  return [...byTarget.values()];
}

type FillResult = {
  fields: Record<string, string>;
  unfillable: Array<{ form_type: string; target_field: string; source_field: string }>;
};

function fillForm(mappings: Mapping[], ctx: Json): FillResult {
  const fields: Record<string, string> = {};
  const unfillable: FillResult["unfillable"] = [];
  for (const m of mappings) {
    const raw = pick(ctx, m.source_field);
    const value =
      raw === null || raw === undefined || String(raw).trim() === ""
        ? (m.fallback_value ?? "")
        : String(raw);
    fields[m.target_field] = value;
    if (!value && m.required) {
      unfillable.push({
        form_type: m.form_type,
        target_field: m.target_field,
        source_field: m.source_field,
      });
    }
  }
  return { fields, unfillable };
}

// ---------------------------------------------------------------------------
// NTO — reuse the existing nto_filings record + generator
// ---------------------------------------------------------------------------

async function ntoPdf(
  permitId: string,
  fields: Record<string, string>,
): Promise<{ bytes: Uint8Array; reused: boolean; path: string | null }> {
  const { data: existing } = await admin
    .from("nto_filings")
    .select("*")
    .eq("permit_id", permitId)
    .maybeSingle();

  // Already generated and stored by the app — take that file as-is.
  if (existing?.pdf_path) {
    const { data: file } = await admin.storage.from(BUCKET).download(existing.pdf_path);
    if (file) {
      return {
        bytes: new Uint8Array(await file.arrayBuffer()),
        reused: true,
        path: existing.pdf_path,
      };
    }
  }

  const row = {
    permit_id: permitId,
    owner_name: fields.owner_name || null,
    owner_address: fields.owner_address || null,
    owner_email: fields.owner_email || null,
    property_address: fields.property_address || null,
    contractor_name: fields.contractor_name || "",
    contractor_address: fields.contractor_address || "",
    work_description: fields.work_description || null,
    first_work_date: fields.first_work_date || null,
    status: existing?.status ?? "draft",
  };

  if (existing?.id) {
    await admin.from("nto_filings").update(row).eq("id", existing.id);
  } else {
    await admin.from("nto_filings").insert(row);
  }

  return { bytes: await buildNtoPdfBytes(row), reused: false, path: null };
}

// ---------------------------------------------------------------------------
// bundle
// ---------------------------------------------------------------------------

async function mergePdfs(parts: Array<{ label: string; bytes: Uint8Array }>): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  out.setTitle("Cleard permit submittal bundle");
  for (const part of parts) {
    const src = await PDFDocument.load(part.bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
  }
  return await out.save();
}

async function notifyStaff(permitId: string, title: string, body: string): Promise<number> {
  const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const ids = (admins ?? []).map((r: { user_id: string }) => r.user_id);
  const rows = (ids.length ? ids : [null]).map((uid) => ({
    user_id: uid,
    kind: "action_required",
    title,
    body,
    permit_id: permitId,
  }));
  const { error } = await admin.from("notifications").insert(rows);
  return error ? 0 : rows.length;
}

// ---------------------------------------------------------------------------
// handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { permit_id?: string };
    const permitId = body.permit_id;
    if (!permitId) {
      return new Response(JSON.stringify({ error: "permit_id required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: permit, error: permitErr } = await admin
      .from("permits")
      .select("*")
      .eq("id", permitId)
      .maybeSingle();
    if (permitErr) throw permitErr;
    if (!permit) {
      return new Response(JSON.stringify({ error: "permit not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let tenant: Json | null = null;
    if (permit.tenant_id) {
      const { data } = await admin
        .from("tenants")
        .select("*")
        .eq("id", permit.tenant_id)
        .maybeSingle();
      tenant = (data as Json) ?? null;
    }

    const intake = (permit.intake_payload ?? {}) as Json;
    const ctx: Json = {
      permit,
      intake,
      tenant: tenant ?? {},
      firm: {
        firm_name: FLORIDIAN_FIRM.firmName,
        private_provider: FLORIDIAN_FIRM.privateProvider,
        telephone: FLORIDIAN_FIRM.telephone,
        email: FLORIDIAN_FIRM.email,
        license_number: FLORIDIAN_FIRM.licenseNumber,
        address_line_1: FLORIDIAN_FIRM.addressLine1,
        address_line_2: FLORIDIAN_FIRM.addressLine2,
      },
    };

    const jurisdiction =
      (permit.municipality as string | null) ?? (permit.city as string | null) ?? "";
    const checklist = getChecklist(jurisdiction, permit.permit_type);

    const { data: mappingRows, error: mapErr } = await admin
      .from("form_field_mappings")
      .select("jurisdiction, form_type, source_field, target_field, required, fallback_value");
    if (mapErr) throw mapErr;
    const mappings = (mappingRows ?? []) as Mapping[];

    // Which forms to produce: every checklist item this function knows how to
    // generate, plus the NTO (always required in FL) and the owner
    // authorization when the permit flags it.
    const wanted = new Map<string, string>(); // formType -> label
    for (const doc of checklist) {
      const gen = GENERATORS[doc.key];
      if (gen) wanted.set(gen.formType, gen.label);
    }
    wanted.set("nto", "Notice to Owner");
    const ownerAuthRequired =
      intake.owner_authorization_required === true ||
      intake.private_provider === true ||
      checklist.some((d) => d.key === "owner_authorization");
    if (ownerAuthRequired) wanted.set("owner_authorization", "Owner Authorization");

    const parts: Array<{ label: string; bytes: Uint8Array }> = [];
    const unfillable: FillResult["unfillable"] = [];
    const generated: Array<{ form_type: string; label: string; reused: boolean }> = [];

    for (const [formType, label] of wanted) {
      const resolved = resolveMappings(mappings, jurisdiction, formType);
      if (resolved.length === 0) continue;
      const { fields, unfillable: missing } = fillForm(resolved, ctx);
      unfillable.push(...missing);

      if (formType === "nto") {
        const nto = await ntoPdf(permitId, fields);
        parts.push({ label, bytes: nto.bytes });
        generated.push({ form_type: formType, label, reused: nto.reused });
      } else if (formType === "owner_authorization") {
        parts.push({
          label,
          bytes: await generateOwnerAuth({
            propertyAddress: fields.propertyAddress ?? "",
            permitProjectNo: fields.permitProjectNo ?? "",
            firmName: fields.firmName ?? "",
            privateProvider: fields.privateProvider ?? "",
            telephone: fields.telephone ?? "",
            email: fields.email ?? "",
            licenseNumber: fields.licenseNumber ?? "",
          }),
        });
        generated.push({ form_type: formType, label, reused: false });
      } else if (formType === "ntbo") {
        parts.push({
          label,
          bytes: await generateNTBO({
            projectName: (permit.project_name as string) ?? "",
            parcelTaxId: (permit.pcn as string) ?? "",
            services: { plansReview: true, inspections: true },
            signatoryType: FLORIDIAN_FIRM.signatoryType,
            firmName: FLORIDIAN_FIRM.firmName,
            privateProvider: FLORIDIAN_FIRM.privateProvider,
            addressLine1: FLORIDIAN_FIRM.addressLine1,
            addressLine2: FLORIDIAN_FIRM.addressLine2,
            telephone: FLORIDIAN_FIRM.telephone,
            email: FLORIDIAN_FIRM.email,
            licenseNumber: FLORIDIAN_FIRM.licenseNumber,
            printNameCorporation: FLORIDIAN_FIRM.printNameCorporation,
            representativeName: FLORIDIAN_FIRM.representativeName,
          }),
        });
        generated.push({ form_type: formType, label, reused: false });
      }
    }

    if (parts.length === 0) {
      return new Response(JSON.stringify({ error: "no generatable forms for this jurisdiction" }), {
        status: 422,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const bundle = await mergePdfs(parts);
    const path = `document-bundles/${permitId}/submittal-bundle-${Date.now()}.pdf`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bundle, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);

    // Checklist items that still need a human to supply a file.
    const outstandingDocs = checklist
      .filter((d) => d.required && !GENERATORS[d.key])
      .map((d) => d.label);

    const report = {
      generated_at: new Date().toISOString(),
      jurisdiction,
      forms: generated,
      pages: parts.length,
      unfillable_fields: unfillable,
      outstanding_documents: outstandingDocs,
      bundle_path: path,
    };

    await admin
      .from("permits")
      .update({
        document_bundle_path: path,
        document_bundle_generated_at: report.generated_at,
        document_bundle_report: report,
      })
      .eq("id", permitId);

    let notified = 0;
    if (unfillable.length > 0) {
      notified = await notifyStaff(
        permitId,
        `Document bundle needs data — ${permit.project_name}`,
        [
          `${unfillable.length} required field(s) could not be filled from the permit record:`,
          ...unfillable.map(
            (u) => `• ${u.form_type}.${u.target_field} (expected ${u.source_field})`,
          ),
        ].join("\n"),
      );
    }

    await admin.from("activity_events").insert({
      tenant_id: permit.tenant_id,
      permit_id: permitId,
      event_type: "documents_generated",
      actor_label: "Cleard automation",
      summary: `Generated ${generated.map((g) => g.label).join(", ")} bundle (${parts.length} form(s))`,
      details: report,
    });

    return new Response(
      JSON.stringify({
        permit_id: permitId,
        bundle_path: path,
        signed_url: signed?.signedUrl ?? null,
        notified,
        report,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("document-generation failed", err);
    return new Response(JSON.stringify({ error: errorMessage(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
