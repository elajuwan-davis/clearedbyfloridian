// Server-only HOA send + reply logic.
//
// HOA contact PII (hoa_contact_name / hoa_contact_email / hoa_contact_phone)
// is tenant-private on public.hoa_templates. Communities remain shared across
// tenants through the non-PII view public.hoa_templates_shared, so the contact
// must be resolved HERE — server-side, with the service-role client, and only
// after the caller's access to the submittal has been proven through RLS.
// The contact is used to build outgoing email and is never returned to the
// browser.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type SB = {
  from: (table: string) => any;
};

const FLORIDIAN_FROM = "info@cleard.com";

export type OutboxAttachment = {
  label: string;
  path: string;
  filename?: string;
};

export type SendResult = {
  hoaEmailId: string | null;
  homeownerEmailId: string | null;
  warnings: string[];
};

export type TemplateContact = {
  hoa_contact_name: string | null;
  hoa_contact_email: string | null;
  hoa_contact_phone: string | null;
  community_name: string;
  city: string;
  deposit_amount_cents: number;
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function buildAttachments(row: any): OutboxAttachment[] {
  const atts: OutboxAttachment[] = [];
  if (row.generated_pdf_path) {
    atts.push({ label: "ARC Submittal PDF", path: row.generated_pdf_path, filename: "arc-submittal.pdf" });
  }
  if (row.uploaded_form_path) {
    atts.push({ label: "Uploaded HOA form", path: row.uploaded_form_path, filename: "hoa-form.pdf" });
  }
  if (row.removal_agreement_path) {
    atts.push({ label: "Removal Agreement", path: row.removal_agreement_path, filename: "removal-agreement.pdf" });
  }
  for (const d of row.documents ?? []) {
    atts.push({ label: d.label, path: d.path, filename: d.filename });
  }
  for (const c of row.checklist ?? []) {
    if (c.document_path) atts.push({ label: c.label, path: c.document_path, filename: c.filename ?? undefined });
  }
  return atts;
}

/** Service-role read of a single template's contact block. Never returned to the client. */
async function resolveTemplateContact(templateId: string | null): Promise<TemplateContact | null> {
  if (!templateId) return null;
  const { data } = await (supabaseAdmin.from("hoa_templates") as any)
    .select("hoa_contact_name, hoa_contact_email, hoa_contact_phone, community_name, city, deposit_amount_cents")
    .eq("id", templateId)
    .maybeSingle();
  return (data as TemplateContact) ?? null;
}

/** Reads the submittal as the caller — RLS proves tenant ownership. */
async function loadSubmittal(sb: SB, submittalId: string): Promise<any> {
  const { data, error } = await sb
    .from("hoa_submittals")
    .select("*")
    .eq("id", submittalId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Submittal not found");
  return data;
}

async function enqueueEmail(
  sb: SB,
  row: {
    kind: string;
    to_email: string;
    to_name?: string | null;
    subject: string;
    body_text: string;
    related_submittal_id: string | null;
    attachments?: OutboxAttachment[];
    tenant_id: string | null;
    created_by: string | null;
  },
): Promise<{ id: string }> {
  const { data, error } = await sb
    .from("email_outbox")
    .insert({
      kind: row.kind,
      to_email: row.to_email,
      to_name: row.to_name ?? null,
      cc_emails: [],
      subject: row.subject,
      body_text: row.body_text,
      body_html: null,
      related_submittal_id: row.related_submittal_id,
      attachments: row.attachments ?? [],
      status: "queued",
      tenant_id: row.tenant_id,
      created_by: row.created_by,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as any).id as string };
}

async function logEvent(
  sb: SB,
  input: {
    submittalId: string;
    tenantId: string | null;
    actorId: string | null;
    kind: string;
    summary: string;
    details?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await sb.from("hoa_submittal_events").insert({
      submittal_id: input.submittalId,
      tenant_id: input.tenantId,
      actor_id: input.actorId,
      actor_label: null,
      kind: input.kind,
      summary: input.summary,
      details: input.details ?? {},
    });
  } catch {
    // audit logging is best-effort
  }
}

/**
 * Queue the HOA package email + homeowner deposit notice, mark the submittal
 * as sent, and bump the template's last-used stats.
 */
export async function sendHoaSubmittalServer(
  sb: SB,
  opts: { submittalId: string; userId: string | null },
): Promise<SendResult> {
  const submittal = await loadSubmittal(sb, opts.submittalId);
  const tenantId = (submittal.tenant_id as string | null) ?? null;

  const template = await resolveTemplateContact(submittal.template_id ?? null);

  const hoaEmail = template?.hoa_contact_email ?? null;
  if (!hoaEmail) {
    throw new Error(
      "No HOA contact email on file. Add one to the template before sending.",
    );
  }

  const displayName = template
    ? `${template.community_name} (${template.city})`
    : submittal.hoa_name || submittal.community_name || "the HOA";

  const attachments = buildAttachments(submittal);
  const warnings: string[] = [];
  if (attachments.length === 0) {
    warnings.push("No documents attached — the email will be sent with a cover note only.");
  }

  const projectLine = submittal.property_address ? `Property: ${submittal.property_address}` : "";
  const applicantLine = submittal.applicant_name ? `Applicant: ${submittal.applicant_name}` : "";
  const scope = submittal.scope_of_work || submittal.project_description || "See attached ARC package.";

  const hoaBody = [
    `Dear ${template?.hoa_contact_name || "ARC Committee"},`,
    "",
    `On behalf of our client${applicantLine ? " " + submittal.applicant_name : ""}, please find attached the ARC submittal package for ${displayName}.`,
    "",
    projectLine,
    applicantLine,
    submittal.contractor_name
      ? `Contractor: ${submittal.contractor_name}${submittal.contractor_license ? ` (Lic. ${submittal.contractor_license})` : ""}`
      : "",
    "",
    "Scope of work:",
    scope,
    "",
    "Attached:",
    ...attachments.map((a) => `  • ${a.label}`),
    "",
    "Please reply to this thread with confirmation of receipt and any correspondence. Cleard will forward next steps to the applicant.",
    "",
    "Regards,",
    "Cleard",
    FLORIDIAN_FROM,
  ].join("\n");

  const hoaEmailRow = await enqueueEmail(sb, {
    kind: "hoa_submittal_to_hoa",
    to_email: hoaEmail,
    to_name: template?.hoa_contact_name ?? null,
    subject: `ARC Submittal — ${displayName}${submittal.property_address ? ` — ${submittal.property_address}` : ""}`,
    body_text: hoaBody,
    related_submittal_id: submittal.id,
    attachments,
    tenant_id: tenantId,
    created_by: opts.userId,
  });

  let homeownerEmailId: string | null = null;
  const homeownerEmail = submittal.homeowner_email || submittal.applicant_email;
  if (homeownerEmail) {
    const depositCents = template?.deposit_amount_cents || submittal.deposit_amount_cents || 0;
    const depositAmt = depositCents > 0 ? money(depositCents) : null;
    const contactBlock = [
      template?.hoa_contact_name,
      template?.hoa_contact_email,
      template?.hoa_contact_phone,
    ]
      .filter(Boolean)
      .join(" · ");

    const homeownerBody = depositAmt
      ? [
          `Hello${submittal.homeowner_name ? " " + submittal.homeowner_name : ""},`,
          "",
          `Your ${displayName} ARC application has been submitted by Cleard on your behalf.`,
          "",
          `To complete your application, a deposit of ${depositAmt} is required directly to the HOA.`,
          contactBlock
            ? `Please remit payment to ${template?.community_name} — ${contactBlock} — at your earliest convenience.`
            : `Please contact the HOA to remit payment at your earliest convenience.`,
          "",
          "Your application will not be reviewed until the deposit is received.",
          "",
          "— Cleard",
          FLORIDIAN_FROM,
        ].join("\n")
      : [
          `Hello${submittal.homeowner_name ? " " + submittal.homeowner_name : ""},`,
          "",
          `Your ${displayName} ARC application has been submitted by Cleard on your behalf.`,
          "",
          contactBlock
            ? `The HOA (${contactBlock}) will follow up if any additional information is required.`
            : "The HOA will follow up if any additional information is required.",
          "",
          "— Cleard",
          FLORIDIAN_FROM,
        ].join("\n");

    const homeownerRow = await enqueueEmail(sb, {
      kind: "hoa_deposit_to_homeowner",
      to_email: homeownerEmail,
      to_name: submittal.homeowner_name ?? submittal.applicant_name ?? null,
      subject: depositAmt
        ? "HOA Submittal Submitted — Deposit Required"
        : "HOA Submittal Submitted",
      body_text: homeownerBody,
      related_submittal_id: submittal.id,
      tenant_id: tenantId,
      created_by: opts.userId,
    });
    homeownerEmailId = homeownerRow.id;
  } else {
    warnings.push("No homeowner email on file — deposit notice was not queued.");
  }

  const now = new Date().toISOString();
  const { error: updErr } = await sb
    .from("hoa_submittals")
    .update({
      status: "submitted_to_hoa",
      sent_to_hoa_at: now,
      submitted_at: submittal.submitted_at ?? now,
      homeowner_notified_at: homeownerEmailId ? now : submittal.homeowner_notified_at,
    })
    .eq("id", submittal.id);
  if (updErr) throw updErr;

  // Shared-repository usage stats. Uses the service-role client so usage is
  // tracked even when the community template belongs to another tenant.
  if (submittal.template_id) {
    try {
      const { data: cur } = await (supabaseAdmin.from("hoa_templates") as any)
        .select("usage_count")
        .eq("id", submittal.template_id)
        .maybeSingle();
      await (supabaseAdmin.from("hoa_templates") as any)
        .update({
          last_used_at: now,
          usage_count: ((cur?.usage_count as number | undefined) ?? 0) + 1,
        })
        .eq("id", submittal.template_id);
    } catch {
      // best-effort
    }
  }

  await logEvent(sb, {
    submittalId: submittal.id,
    tenantId,
    actorId: opts.userId,
    kind: "sent_to_hoa",
    summary: `ARC package queued to ${hoaEmail}`,
    details: { hoa_email: hoaEmail, attachments: attachments.length, warnings },
  });
  if (homeownerEmailId) {
    await logEvent(sb, {
      submittalId: submittal.id,
      tenantId,
      actorId: opts.userId,
      kind: "homeowner_notified",
      summary: `Deposit notice queued to ${homeownerEmail}`,
      details: { homeowner_email: homeownerEmail },
    });
  }

  return { hoaEmailId: hoaEmailRow.id, homeownerEmailId, warnings };
}

/**
 * Log an HOA reply. When the caller leaves the sender blank we resolve the
 * default from the template's HOA contact server-side, so the browser never
 * needs the address.
 */
export async function logHoaReplyServer(
  sb: SB,
  opts: {
    submittalId: string;
    subject: string;
    bodyText: string;
    direction: "inbound" | "outbound";
    fromEmail: string | null;
    userId: string | null;
  },
): Promise<any> {
  const submittal = await loadSubmittal(sb, opts.submittalId);
  const tenantId = (submittal.tenant_id as string | null) ?? null;

  let fromEmail = opts.fromEmail?.trim() || null;
  let fromName: string | null = null;
  if (!fromEmail) {
    const template = await resolveTemplateContact(submittal.template_id ?? null);
    fromEmail = template?.hoa_contact_email ?? null;
    fromName = template?.hoa_contact_name ?? null;
  }

  const { data, error } = await sb
    .from("hoa_submittal_replies")
    .insert({
      submittal_id: submittal.id,
      tenant_id: tenantId,
      direction: opts.direction,
      from_email: fromEmail,
      from_name: fromName,
      to_email: null,
      subject: opts.subject,
      body_text: opts.bodyText,
      received_at: new Date().toISOString(),
      logged_by: opts.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
