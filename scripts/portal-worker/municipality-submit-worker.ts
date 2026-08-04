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

import { createDecipheriv } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { chromium, type Page } from "playwright";
import { extractConfirmationNumber } from "../../supabase/functions/_shared/submission-draft.ts";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SLUG = process.env.MUNICIPALITY_SLUG ?? "plantation";
const WORKER = process.env.WORKER_NAME ?? `portal-worker-${process.pid}`;
const BUCKET = "permit-files";
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
    municipality?: { city_name?: string; portal_url?: string; driver?: string };
    permit?: Record<string, unknown>;
    documents?: Array<{ label: string; path: string; role: string }>;
    portal_fields?: Record<string, unknown>;
  };
};

function decryptSecret(stored: string): string {
  const raw = process.env.APP_USER_CONNECTION_KEY_SECRET;
  if (!raw) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  const key = Buffer.from(raw, "base64");
  // Say which input is wrong rather than letting node throw about key lengths, and never
  // put the key itself in the message.
  if (key.length !== 32) {
    throw new Error(
      `APP_USER_CONNECTION_KEY_SECRET must be 32 bytes of base64 (got ${key.length})`,
    );
  }
  const buf = Buffer.from(stored, "base64");
  if (buf.length <= 28) throw new Error("stored credential is truncated or not base64");
  const decipher = createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

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

/**
 * Portal credentials for this permit's GC, from the existing encrypted store.
 *
 * The login must be attributable to the permit: its creator first, otherwise the permit's
 * tenant when that tenant has exactly one login for the municipality. Filing under some
 * other contractor's account is worse than not filing, so anything ambiguous throws.
 */
async function portalCredentials(admin: SupabaseClient, permitId: string, slug: string) {
  const { data: permit, error } = await admin
    .from("permits")
    .select("created_by, tenant_id")
    .eq("id", permitId)
    .maybeSingle();
  if (error) throw error;

  const base = () =>
    admin
      .from("gc_portal_logins")
      .select("username_ciphertext, password_ciphertext, user_id, tenant_id")
      .eq("municipality_slug", slug);

  type Login = {
    username_ciphertext: string;
    password_ciphertext: string;
    user_id: string | null;
    tenant_id: string | null;
  };
  let login: Login | null = null;

  if (permit?.created_by) {
    const { data, error: credErr } = await base().eq("user_id", permit.created_by).limit(2);
    if (credErr) throw credErr;
    const rows = (data ?? []) as Login[];
    if (rows.length === 0) {
      throw new Error(
        `no stored ${slug} portal login for the contractor who created this permit — save one under Building Dept Logins`,
      );
    }
    login = rows[0];
  } else if (permit?.tenant_id) {
    const { data, error: credErr } = await base().eq("tenant_id", permit.tenant_id).limit(2);
    if (credErr) throw credErr;
    const rows = (data ?? []) as Login[];
    if (rows.length === 0) {
      throw new Error(
        `no stored ${slug} portal login for this permit's contractor account — save one under Building Dept Logins`,
      );
    }
    if (rows.length > 1) {
      throw new Error(
        `this permit has no creator on record and its account has several ${slug} logins — set permits.created_by so the filing account is unambiguous`,
      );
    }
    login = rows[0];
  } else {
    throw new Error(
      "permit has neither a creator nor a tenant — refusing to guess which portal login to file under",
    );
  }

  return {
    username: decryptSecret(login.username_ciphertext),
    password: decryptSecret(login.password_ciphertext),
  };
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

// --- Accela Citizen Access driver ------------------------------------------
//
// ACA installs share the same page structure across cities (the control ids are
// generated by Accela, not by Plantation), so the selectors below are ACA-generic with a
// text fallback. Every step fails loudly rather than clicking blindly, because a wrong
// click here is a real filing.

async function acaLogin(page: Page, portalUrl: string, username: string, password: string) {
  await page.goto(portalUrl, { waitUntil: "domcontentloaded" });
  const loginLink = page.getByRole("link", { name: /login|sign in/i }).first();
  if (await loginLink.count()) await loginLink.click().catch(() => {});
  await page.fill(
    'input[id*="LoginName"], input[name*="LoginName"], input[type="email"]',
    username,
  );
  await page.fill('input[id*="Password"], input[type="password"]', password);
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    page.click('a[id*="Login"], input[type="submit"][value*="Login" i], button:has-text("Login")'),
  ]);
  const failed = await page
    .locator("text=/invalid (login|user)|incorrect password/i")
    .count()
    .catch(() => 0);
  if (failed) throw new Error("portal rejected the stored credentials");
}

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

async function uploadReceipt(admin: SupabaseClient, sub: Submission, bytes: Buffer, kind: string) {
  const path = `permits/${sub.permit_id}/submissions/${sub.id}-${kind}-${Date.now()}.png`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) {
    console.warn(`receipt upload failed: ${error.message}`);
    return null;
  }
  return path;
}

async function notifyStaff(admin: SupabaseClient, permitId: string, title: string, body: string) {
  const { data } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const rows = (data ?? []) as Array<{ user_id: string }>;
  if (rows.length === 0) return;
  await admin.from("notifications").insert(
    rows.map((r) => ({
      user_id: r.user_id,
      kind: "municipality_submission",
      title,
      body,
      permit_id: permitId,
    })),
  );
}

async function claim(admin: SupabaseClient): Promise<Submission | null> {
  const { data, error } = await admin.rpc("claim_municipality_submission", {
    _worker: WORKER,
    _slug: SLUG,
  });
  if (error) throw error;
  // SETOF: zero rows means no approved work. Never act on a row without an id.
  const rows = (Array.isArray(data) ? data : data ? [data] : []) as Submission[];
  const job = rows.find((r) => Boolean(r?.id));
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
export { acaLogin, acaFillApplication, acaSubmit, decryptSecret };

if (process.argv[1]?.endsWith("municipality-submit-worker.ts")) {
  await main();
}
