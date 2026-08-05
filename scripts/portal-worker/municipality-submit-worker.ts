// Agent 5 — portal submission worker (pilot: City of Plantation, Accela Citizen Access).
//
// Why this is not an edge function: Playwright needs a real browser binary, and Lovable
// Cloud edge functions are Deno isolates with no browser. So the edge function owns the
// draft + approval gate, and this worker owns the keyboard. It can ONLY act on rows a
// staff member already approved: claim_municipality_submission() selects
// status='approved' AND approved_by IS NOT NULL, so an unapproved draft is invisible to it.
//
// Credentials come from the existing encrypted gc_portal_logins store (AES-256-GCM under
// APP_USER_CONNECTION_KEY_SECRET) — no second credential store.
//
// Run:
//   npx tsx scripts/portal-worker/municipality-submit-worker.ts --once
//   npx tsx scripts/portal-worker/municipality-submit-worker.ts --once --dry-run
//
// --dry-run drives the whole flow but stops before the final Submit click and releases the
// job back to 'approved', so the driver can be exercised without filing anything.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_USER_CONNECTION_KEY_SECRET,
//      optional MUNICIPALITY_SLUG (default 'plantation'), WORKER_NAME, HEADFUL=1.

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { chromium, type Page } from "playwright";
import { extractConfirmationNumber } from "../../supabase/functions/_shared/submission-draft.ts";
import {
  BUCKET,
  acaLogin,
  claimOne,
  notifyStaff,
  portalCredentials,
  uploadBytes,
} from "./shared.ts";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SLUG = process.env.MUNICIPALITY_SLUG ?? "plantation";
const WORKER = process.env.WORKER_NAME ?? `portal-worker-${process.pid}`;
const DRY_RUN = process.argv.includes("--dry-run");
const ONCE = process.argv.includes("--once");
const POLL_MS = Number(process.env.POLL_MS ?? 30_000);

type Submission = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  municipality_slug: string;
  status: string;
  approved_by: string | null;
  attempts: number;
  draft: {
    test_only?: boolean;
    municipality?: { city_name?: string; portal_url?: string; driver?: string };
    permit?: Record<string, unknown>;
    documents?: Array<{ label: string; path: string; role: string }>;
    portal_fields?: Record<string, unknown>;
  };
};

async function logEvent(
  admin: SupabaseClient,
  submissionId: string,
  eventType: string,
  detail: Record<string, unknown> = {},
) {
  await admin.from("municipality_submission_events").insert({
    submission_id: submissionId,
    event_type: eventType,
    actor_label: WORKER,
    detail,
  });
}

async function downloadDocuments(
  admin: SupabaseClient,
  documents: Array<{ label: string; path: string }>,
) {
  const dir = await mkdtemp(join(tmpdir(), "cleard-submit-"));
  const files: Array<{ label: string; file: string }> = [];
  for (const doc of documents) {
    const { data, error } = await admin.storage.from(BUCKET).download(doc.path);
    if (error) throw new Error(`could not download ${doc.path}: ${error.message}`);
    const file = join(dir, doc.path.split("/").pop() ?? `${doc.label}.pdf`);
    await writeFile(file, Buffer.from(await data.arrayBuffer()));
    files.push({ label: doc.label, file });
  }
  return { dir, files };
}

// --- Accela Citizen Access application wizard -------------------------------
//
// The login lives in shared.ts (Agent 6's poller needs the same one). Every step below
// fails loudly rather than clicking blindly, because a wrong click here is a real filing.

async function acaFillApplication(
  page: Page,
  fields: Record<string, unknown>,
  files: Array<{ label: string; file: string }>,
) {
  // Building > Application, then the record type from the draft.
  await page
    .getByRole("link", { name: /create an application|apply for a permit/i })
    .first()
    .click();
  const accept = page.locator('input[type="checkbox"][id*="Agree"], input[id*="Accept"]').first();
  if (await accept.count()) await accept.check().catch(() => {});
  await page
    .getByRole("link", { name: /continue application/i })
    .first()
    .click();

  const recordType = String(fields.record_type ?? "");
  const typeRadio = page
    .locator(`tr:has-text(${JSON.stringify(recordType)}) input[type="radio"]`)
    .first();
  if (!(await typeRadio.count())) {
    throw new Error(`record type "${recordType}" not offered by the portal for this account`);
  }
  await typeRadio.check();
  await page
    .getByRole("link", { name: /continue application/i })
    .first()
    .click();

  const address = String(fields.job_address ?? "");
  const [streetNo, ...rest] = address.split(" ");
  await page.fill('input[id*="StreetNo"], input[id*="AddressLine1"]', streetNo ?? "");
  const streetName = page.locator('input[id*="StreetName"]').first();
  if (await streetName.count()) await streetName.fill(rest.join(" "));
  await page
    .getByRole("link", { name: /continue application/i })
    .first()
    .click();

  const description = page
    .locator('textarea[id*="Description"], textarea[id*="DetailInfo"]')
    .first();
  if (await description.count()) await description.fill(String(fields.work_description ?? ""));
  const value = page.locator('input[id*="JobValue"], input[id*="EstimatedValue"]').first();
  if ((await value.count()) && fields.job_value != null) {
    await value.fill(String(fields.job_value));
  }
  await page
    .getByRole("link", { name: /continue application/i })
    .first()
    .click();

  // Attachments. ACA's upload dialog takes the whole set at once when the control allows
  // it; otherwise each file needs its own Add/Upload round trip.
  const addBtn = page.getByRole("link", { name: /^add$/i }).first();
  if (await addBtn.count()) await addBtn.click().catch(() => {});
  const firstInput = page.locator('input[type="file"]').last();
  const multiple = (await firstInput.getAttribute("multiple")) !== null;
  if (multiple) {
    await firstInput.setInputFiles(files.map((f) => f.file));
    const upload = page.getByRole("link", { name: /^(upload|continue)$/i }).first();
    if (await upload.count()) await upload.click().catch(() => {});
  } else {
    for (const f of files) {
      const add = page.getByRole("link", { name: /^add$/i }).first();
      if (await add.count()) await add.click().catch(() => {});
      await page.locator('input[type="file"]').last().setInputFiles(f.file);
      const upload = page.getByRole("link", { name: /^(upload|continue)$/i }).first();
      if (await upload.count()) await upload.click().catch(() => {});
    }
  }
  await page
    .getByRole("link", { name: /continue application/i })
    .first()
    .click();
}

async function acaSubmit(page: Page) {
  const certify = page.locator('input[type="checkbox"][id*="Certification"]').first();
  if (await certify.count()) await certify.check().catch(() => {});
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    page
      .getByRole("link", { name: /continue application|submit/i })
      .first()
      .click(),
  ]);
  const text = await page.locator("body").innerText();
  return { text, confirmation: extractConfirmationNumber(text) };
}

// --- job runner ------------------------------------------------------------

async function runJob(admin: SupabaseClient, sub: Submission) {
  // Everything after the claim runs inside the failure handler: the row is already
  // 'submitting', so any error here — a missing portal_url, an unattributable login, a
  // browser that will not start — has to release the claim rather than wedge the filing.
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let context: Awaited<ReturnType<NonNullable<typeof browser>["newContext"]>> | null = null;
  let page: Page | null = null;
  let tempDir: string | null = null;

  try {
    if (!sub.approved_by) {
      throw new Error(`submission ${sub.id} has no approver — refusing to file`);
    }
    // claim_municipality_submission() already skips test rows; this repeats the check
    // against a database where that migration has not been applied yet, so a rehearsal
    // row can never reach a real portal.
    if (sub.draft?.test_only === true) {
      await admin
        .from("municipality_submissions")
        .update({
          status: "failed",
          claimed_at: null,
          claimed_by: null,
          last_error: "draft.test_only is true — rehearsal row, nothing was filed",
        })
        .eq("id", sub.id);
      await logEvent(admin, sub.id, "test_only_no_action", { stage: "worker_claim" });
      console.log(`[test-only] ${sub.id} is a rehearsal row; no browser was opened`);
      return;
    }
    const portalUrl = sub.draft?.municipality?.portal_url;
    const fields = sub.draft?.portal_fields ?? {};
    const documents = sub.draft?.documents ?? [];
    if (!portalUrl) throw new Error("draft has no portal_url");

    const creds = await portalCredentials(admin, sub.permit_id, sub.municipality_slug);
    const downloaded = await downloadDocuments(admin, documents);
    tempDir = downloaded.dir;
    const files = downloaded.files;

    browser = await chromium.launch({ headless: !process.env.HEADFUL });
    context = await browser.newContext({ acceptDownloads: true });
    page = await context.newPage();

    await acaLogin(page, portalUrl, creds.username, creds.password);
    await logEvent(admin, sub.id, "portal_logged_in", { portal_url: portalUrl });

    await acaFillApplication(page, fields, files);
    await logEvent(admin, sub.id, "portal_application_filled", {
      documents: files.length,
      dry_run: DRY_RUN,
    });

    if (DRY_RUN) {
      const shot = await page.screenshot({ fullPage: true });
      const path = await uploadReceipt(admin, sub, shot, "dry-run");
      // Put the job back so a real run can still file it.
      await admin
        .from("municipality_submissions")
        .update({ status: "approved", claimed_at: null, claimed_by: null })
        .eq("id", sub.id);
      await logEvent(admin, sub.id, "dry_run_stopped_before_submit", { screenshot: path });
      console.log(`[dry-run] stopped before Submit; review page captured at ${path}`);
      // Releasing the row makes it immediately re-claimable, so a polling worker would walk
      // the portal again every cycle. One practice run per submission per process.
      dryRunDone.add(sub.id);
      return;
    }

    const { confirmation } = await acaSubmit(page);
    const shot = await page.screenshot({ fullPage: true });
    const receiptPath = await uploadReceipt(admin, sub, shot, "receipt");

    if (!confirmation) {
      // Filed, but the number could not be read — never invent one.
      await admin
        .from("municipality_submissions")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          portal_receipt_path: receiptPath,
          last_error: "submitted but no confirmation number could be read from the receipt page",
        })
        .eq("id", sub.id);
      await logEvent(admin, sub.id, "submitted_without_confirmation", { receipt: receiptPath });
    } else {
      await admin
        .from("municipality_submissions")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          confirmation_number: confirmation,
          portal_receipt_path: receiptPath,
          last_error: null,
        })
        .eq("id", sub.id);
      await logEvent(admin, sub.id, "submitted_by_portal", {
        confirmation_number: confirmation,
        receipt: receiptPath,
      });
    }

    await admin.from("permits").update({ status: "submitted" }).eq("id", sub.permit_id);
    await admin.from("activity_events").insert({
      tenant_id: sub.tenant_id,
      permit_id: sub.permit_id,
      event_type: "municipality_submitted",
      actor_label: WORKER,
      summary: `Filed with ${sub.draft?.municipality?.city_name ?? sub.municipality_slug}${
        confirmation ? ` — confirmation ${confirmation}` : ""
      }`,
      details: { submission_id: sub.id, confirmation_number: confirmation },
    });
    await notifyStaff(
      admin,
      sub.permit_id,
      "municipality_submission",
      `Filed with ${sub.draft?.municipality?.city_name ?? sub.municipality_slug}`,
      confirmation
        ? `Confirmation number ${confirmation}.`
        : "Submitted; the confirmation number could not be read automatically — check the receipt.",
    );
    console.log(`submitted ${sub.id}${confirmation ? ` → ${confirmation}` : ""}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const shot = page ? await page.screenshot({ fullPage: true }).catch(() => null) : null;
    const path = shot ? await uploadReceipt(admin, sub, shot, "failure") : null;
    await admin
      .from("municipality_submissions")
      .update({ status: "failed", last_error: message, claimed_at: null, claimed_by: null })
      .eq("id", sub.id);
    await logEvent(admin, sub.id, "failed", { reason: message, screenshot: path });
    await notifyStaff(
      admin,
      sub.permit_id,
      "municipality_submission",
      `Portal submission failed — ${sub.draft?.municipality?.city_name ?? sub.municipality_slug}`,
      `${message} (nothing was filed; the approval is still on record and can be retried)`,
    );
    console.error(`job ${sub.id} failed: ${message}`);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    // The downloaded application package is customer data; it does not stay on the worker.
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Submissions already practice-run in this process, so --dry-run does not loop. */
const dryRunDone = new Set<string>();

function uploadReceipt(admin: SupabaseClient, sub: Submission, bytes: Buffer, kind: string) {
  const path = `permits/${sub.permit_id}/submissions/${sub.id}-${kind}-${Date.now()}.png`;
  return uploadBytes(admin, path, bytes, "image/png");
}

async function claim(admin: SupabaseClient): Promise<Submission | null> {
  const job = await claimOne<Submission>(admin, "claim_municipality_submission", {
    _worker: WORKER,
    _slug: SLUG,
  });
  if (!job) return null;
  if (job.status !== "submitting" || !job.approved_by) {
    throw new Error(
      `refusing job ${job.id}: claimed row is ${job.status} and approved_by=${job.approved_by}`,
    );
  }
  return job;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  for (;;) {
    // A claim or job failure must never end the process: the next poll has to keep serving
    // the other approved filings.
    try {
      const job = await claim(admin);
      if (job && DRY_RUN && dryRunDone.has(job.id)) {
        // Already practice-run here; releasing it again would just re-walk the portal.
        await admin
          .from("municipality_submissions")
          .update({ status: "approved", claimed_at: null, claimed_by: null })
          .eq("id", job.id);
        console.log(`[dry-run] ${job.id} already exercised in this run — skipping`);
      } else if (job) {
        console.log(
          `claimed ${job.id} (permit ${job.permit_id}, approved by ${job.approved_by})${
            DRY_RUN ? " [dry-run]" : ""
          }`,
        );
        await runJob(admin, job);
      } else if (ONCE) {
        console.log("no approved portal submissions waiting");
      }
    } catch (err) {
      console.error(`worker cycle failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (ONCE) return;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

// Exported for the driver unit tests; only runs the loop when invoked directly.
export { acaFillApplication, acaSubmit };

if (process.argv[1]?.endsWith("municipality-submit-worker.ts")) {
  await main();
}
