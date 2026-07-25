// Direct submission — queues the HOA package email + the homeowner deposit
// notification from the completed submittal + its template.
import { getHoaSubmittal, updateHoaSubmittal, type HoaSubmittalRow } from "@/lib/hoa-submittals";
import { getHoaTemplate, markTemplateUsed, displayNameFor, type HoaTemplateRow } from "@/lib/hoa-templates";
import { enqueueEmail, type OutboxAttachment } from "@/lib/email-outbox";

const FLORIDIAN_FROM = "info@cleard.com";

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function buildAttachments(row: HoaSubmittalRow): OutboxAttachment[] {
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

export type SendResult = {
  hoaEmailId: string | null;
  homeownerEmailId: string | null;
  warnings: string[];
};

/**
 * Queue the HOA package email + homeowner deposit notice, mark the submittal
 * as sent, and bump the template's last-used timestamp.
 */
export async function sendHoaSubmittal(
  submittalId: string,
  ctx: { tenantId: string | null; userId: string | null },
): Promise<SendResult> {
  const submittal = await getHoaSubmittal(submittalId);
  if (!submittal) throw new Error("Submittal not found");

  let template: HoaTemplateRow | null = null;
  if (submittal.template_id) template = await getHoaTemplate(submittal.template_id);

  const hoaEmail = template?.hoa_contact_email ?? null;
  if (!hoaEmail) {
    throw new Error(
      "No HOA contact email on file. Add one to the template before sending.",
    );
  }

  const displayName = template
    ? displayNameFor(template)
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
    submittal.contractor_name ? `Contractor: ${submittal.contractor_name}${submittal.contractor_license ? ` (Lic. ${submittal.contractor_license})` : ""}` : "",
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
    "Cleard by Flōridian",
    FLORIDIAN_FROM,
  ]
    .filter((line) => line !== "" || true)
    .join("\n");

  const hoaEmailRow = await enqueueEmail({
    kind: "hoa_submittal_to_hoa",
    to_email: hoaEmail,
    to_name: template?.hoa_contact_name ?? null,
    subject: `ARC Submittal — ${displayName}${submittal.property_address ? ` — ${submittal.property_address}` : ""}`,
    body_text: hoaBody,
    related_submittal_id: submittal.id,
    attachments,
    tenant_id: ctx.tenantId,
    created_by: ctx.userId,
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
          contactBlock ? `Please remit payment to ${template?.community_name} — ${contactBlock} — at your earliest convenience.` : `Please contact the HOA to remit payment at your earliest convenience.`,
          "",
          "Your application will not be reviewed until the deposit is received.",
          "",
          "— Cleard by Flōridian",
          FLORIDIAN_FROM,
        ].join("\n")
      : [
          `Hello${submittal.homeowner_name ? " " + submittal.homeowner_name : ""},`,
          "",
          `Your ${displayName} ARC application has been submitted by Cleard on your behalf.`,
          "",
          contactBlock ? `The HOA (${contactBlock}) will follow up if any additional information is required.` : "The HOA will follow up if any additional information is required.",
          "",
          "— Cleard by Flōridian",
          FLORIDIAN_FROM,
        ].join("\n");

    const homeownerRow = await enqueueEmail({
      kind: "hoa_deposit_to_homeowner",
      to_email: homeownerEmail,
      to_name: submittal.homeowner_name ?? submittal.applicant_name ?? null,
      subject: depositAmt
        ? "HOA Submittal Submitted — Deposit Required"
        : "HOA Submittal Submitted",
      body_text: homeownerBody,
      related_submittal_id: submittal.id,
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
    });
    homeownerEmailId = homeownerRow.id;
  } else {
    warnings.push("No homeowner email on file — deposit notice was not queued.");
  }

  const now = new Date().toISOString();
  await updateHoaSubmittal(submittal.id, {
    status: "submitted_to_hoa",
    sent_to_hoa_at: now,
    submitted_at: submittal.submitted_at ?? now,
    homeowner_notified_at: homeownerEmailId ? now : submittal.homeowner_notified_at,
  } as any);

  if (submittal.template_id) {
    markTemplateUsed(submittal.template_id).catch(() => undefined);
  }

  return {
    hoaEmailId: hoaEmailRow.id,
    homeownerEmailId,
    warnings,
  };
}
