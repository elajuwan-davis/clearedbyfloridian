import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "permit-files";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const ScanInput = z.object({ subId: z.string().uuid() });

type CoiExtracted = {
  policies: Array<{
    type: string; // GL, WC, Umbrella, Auto, Excess, etc.
    effective_date?: string | null;
    expiration_date?: string | null;
    per_occurrence_cents?: number | null;
    aggregate_cents?: number | null;
  }>;
  named_insured?: string | null;
  certificate_holder?: string | null;
};

type W9Extracted = {
  legal_business_name?: string | null;
  business_type?: string | null;
  tax_id_present?: boolean;
  signature_present?: boolean;
  date_signed?: string | null;
};

function inferMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function downloadBase64(path: string, filename: string): Promise<{ b64: string; mime: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(error?.message ?? "Failed to download document");
  const buf = Buffer.from(await data.arrayBuffer());
  return { b64: buf.toString("base64"), mime: inferMimeFromName(filename) };
}

async function callAiForJson(system: string, user: string, file: { b64: string; mime: string; filename: string }) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const isImage = file.mime.startsWith("image/");
  const contentBlocks: unknown[] = [{ type: "text", text: user }];
  if (isImage) {
    contentBlocks.push({
      type: "image_url",
      image_url: { url: `data:${file.mime};base64,${file.b64}` },
    });
  } else {
    contentBlocks.push({
      type: "file",
      file: {
        filename: file.filename,
        file_data: `data:${file.mime};base64,${file.b64}`,
      },
    });
  }

  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-5.5",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: contentBlocks },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI Gateway error ${resp.status}: ${t.slice(0, 300)}`);
  }
  const json = await resp.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  try {
    return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
  } catch {
    throw new Error("AI returned non-JSON");
  }
}

async function getMinimums() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin.from("gc_coi_minimums" as any) as any)
    .select("*")
    .eq("gc_name", "Default")
    .maybeSingle();
  return data ?? {
    gl_per_occurrence_cents: 100_000_000,
    gl_aggregate_cents: 200_000_000,
    umbrella_cents: 200_000_000,
    wc_required: true,
  };
}

function evaluateCoi(extracted: CoiExtracted, mins: any): { status: "verified" | "needs_review"; flags: string[] } {
  const flags: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const gl = extracted.policies?.find((p) => /general\s*liability|^gl$/i.test(p.type));
  const wc = extracted.policies?.find((p) => /workers|wc/i.test(p.type));
  const umb = extracted.policies?.find((p) => /umbrella|excess/i.test(p.type));

  if (!gl) {
    flags.push("No General Liability policy detected");
  } else {
    if (gl.expiration_date && gl.expiration_date < today) flags.push("General Liability expired");
    if ((gl.per_occurrence_cents ?? 0) < mins.gl_per_occurrence_cents)
      flags.push(`GL per-occurrence below minimum ($${(mins.gl_per_occurrence_cents / 100).toLocaleString()})`);
    if ((gl.aggregate_cents ?? 0) < mins.gl_aggregate_cents)
      flags.push(`GL aggregate below minimum ($${(mins.gl_aggregate_cents / 100).toLocaleString()})`);
  }

  if (mins.wc_required && !wc) flags.push("No Workers' Compensation policy detected");
  else if (wc?.expiration_date && wc.expiration_date < today) flags.push("Workers' Compensation expired");

  if (umb) {
    if (umb.expiration_date && umb.expiration_date < today) flags.push("Umbrella policy expired");
    if ((umb.per_occurrence_cents ?? 0) < mins.umbrella_cents)
      flags.push(`Umbrella below minimum ($${(mins.umbrella_cents / 100).toLocaleString()})`);
  }

  return { status: flags.length ? "needs_review" : "verified", flags };
}

function evaluateW9(extracted: W9Extracted): { status: "verified" | "incomplete"; flags: string[] } {
  const flags: string[] = [];
  if (!extracted.legal_business_name) flags.push("Missing legal business name");
  if (!extracted.business_type) flags.push("Missing business type");
  if (!extracted.tax_id_present) flags.push("Missing EIN/SSN");
  if (!extracted.signature_present) flags.push("Signature line blank");
  if (!extracted.date_signed) flags.push("Missing signature date");
  return { status: flags.length ? "incomplete" : "verified", flags };
}

async function notify(userId: string | null, kind: string, title: string, body: string, permitId?: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await (supabaseAdmin.from("notifications" as any) as any).insert({
    user_id: userId,
    kind,
    title,
    body,
    permit_id: permitId ?? null,
  });
}

/* ------------------------------ COI SCAN ------------------------------ */

export const scanCoiFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .select("id, company_name, trade, coi_file_path, coi_file_name, created_by")
      .eq("id", data.subId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub?.coi_file_path) throw new Error("No COI file uploaded");

    const file = await downloadBase64(sub.coi_file_path, sub.coi_file_name ?? "coi.pdf");
    const system =
      "You are an insurance certificate OCR extractor. Return strict JSON only. Convert dollar limits to cents (integer). Use YYYY-MM-DD for dates. If a field is missing, use null.";
    const user = `Extract from this ACORD 25 / Certificate of Insurance:
{
  "named_insured": string|null,
  "certificate_holder": string|null,
  "policies": [
    { "type": "General Liability"|"Workers Compensation"|"Umbrella"|"Auto"|"Excess"|string,
      "effective_date": "YYYY-MM-DD"|null,
      "expiration_date": "YYYY-MM-DD"|null,
      "per_occurrence_cents": number|null,
      "aggregate_cents": number|null }
  ]
}`;

    const extracted = (await callAiForJson(system, user, {
      ...file,
      filename: sub.coi_file_name ?? "coi.pdf",
    })) as CoiExtracted;

    const mins = await getMinimums();
    const { status, flags } = evaluateCoi(extracted, mins);

    const glExp = extracted.policies?.find((p) => /general\s*liability|^gl$/i.test(p.type))?.expiration_date;

    await (supabaseAdmin.from("subcontractors" as any) as any)
      .update({
        coi_status: status,
        coi_extracted: extracted,
        coi_flags: flags,
        coi_verified_at: new Date().toISOString(),
        coi_expiration: glExp ?? undefined,
      })
      .eq("id", data.subId);

    if (status === "needs_review") {
      await notify(
        sub.created_by,
        "compliance_flag",
        `COI needs review — ${sub.company_name}`,
        `Flags: ${flags.join("; ")}`,
      );
    }

    return { status, flags, extracted };
  });

/* ------------------------------ W-9 SCAN ------------------------------ */

export const scanW9Fn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .select("id, company_name, trade, w9_file_path, w9_file_name, created_by")
      .eq("id", data.subId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub?.w9_file_path) throw new Error("No W-9 file uploaded");

    const file = await downloadBase64(sub.w9_file_path, sub.w9_file_name ?? "w9.pdf");
    const system =
      "You are a W-9 form OCR extractor. Return strict JSON only. Do NOT return the tax ID number itself — only whether the field is populated.";
    const user = `Extract from this IRS Form W-9:
{
  "legal_business_name": string|null,
  "business_type": "Sole Proprietor"|"LLC"|"C Corporation"|"S Corporation"|"Partnership"|"Trust/Estate"|"Other"|null,
  "tax_id_present": boolean,
  "signature_present": boolean,
  "date_signed": "YYYY-MM-DD"|null
}`;

    const extracted = (await callAiForJson(system, user, {
      ...file,
      filename: sub.w9_file_name ?? "w9.pdf",
    })) as W9Extracted;

    const { status, flags } = evaluateW9(extracted);

    await (supabaseAdmin.from("subcontractors" as any) as any)
      .update({
        w9_status: status,
        w9_extracted: extracted,
        w9_flags: flags,
        w9_verified_at: new Date().toISOString(),
      })
      .eq("id", data.subId);

    if (status === "incomplete") {
      await notify(
        sub.created_by,
        "compliance_flag",
        `W-9 incomplete — ${sub.company_name}`,
        `Flags: ${flags.join("; ")}`,
      );
    }

    return { status, flags, extracted };
  });

/* ---------------------------- LICENSE VERIFY ---------------------------- */

const LicenseInput = z.object({ subId: z.string().uuid() });

export const verifyLicenseFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LicenseInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .select("id, company_name, license_number, created_by")
      .eq("id", data.subId)
      .maybeSingle();
    if (!sub?.license_number) throw new Error("No license number on file");

    // Reuse existing DBPR route
    const baseUrl = process.env.SITE_URL || "";
    let dbpr: any = null;
    try {
      const url = baseUrl
        ? `${baseUrl}/api/verify-license?ln=${encodeURIComponent(sub.license_number)}`
        : `https://www.myfloridalicense.com/wl11.asp?mode=2&search=LicNbr&SID=&brd=&typ=false&LicNbr=${encodeURIComponent(sub.license_number)}`;
      const r = await fetch(url);
      if (r.ok) dbpr = await r.json().catch(() => null);
    } catch {
      /* ignore */
    }

    const status = dbpr?.status ?? "unknown";
    const licenseStatus = status === "active" ? "verified" : status === "not_found" || status === "unknown" ? "unknown" : "issue";

    await (supabaseAdmin.from("subcontractors" as any) as any)
      .update({
        dbpr_status: status,
        dbpr_verified_at: new Date().toISOString(),
        dbpr_holder_name: dbpr?.holder_name ?? null,
        dbpr_license_type: dbpr?.license_type ?? null,
        dbpr_expiration: dbpr?.expiration ?? null,
        license_status: licenseStatus,
      })
      .eq("id", data.subId);

    if (licenseStatus === "issue") {
      await notify(
        sub.created_by,
        "compliance_flag",
        `License issue — ${sub.company_name}`,
        `License ${sub.license_number} returned ${status} on DBPR.`,
      );
    }

    return { status: licenseStatus, dbpr };
  });
