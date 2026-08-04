// Agent 6 — permit status poller (pilot: City of Plantation, Accela Citizen Access).
//
// pg_cron runs public.check_permit_status() every 4 hours, which enqueues a
// permit_status_polls row per filed permit that is due for a check. This worker claims
// those polls (claim_permit_status_poll, service role only), reads the record page with
// the same login Agent 5 files with, and hands the result to
// public.apply_permit_status_check() — the comparison, the pipeline update, the
// notification and any correction_notices insert all happen there, in one transaction.
//
// It is read-only against the portal: it never clicks anything that changes a record.
//
// Run:
//   npm run status-worker -- --once
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_USER_CONNECTION_KEY_SECRET,
//      optional MUNICIPALITY_SLUG (default 'plantation'), WORKER_NAME, HEADFUL=1,
//      POLL_MS (idle sleep between claims).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { chromium, type Page } from "playwright";
import {
  extractStatus,
  looksLikeCorrection,
} from "../../supabase/functions/_shared/portal-status.ts";
import { acaLogin, claimOne, notifyStaff, portalCredentials, uploadBytes } from "./shared.ts";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SLUG = process.env.MUNICIPALITY_SLUG ?? "plantation";
const WORKER = process.env.WORKER_NAME ?? `status-worker-${process.pid}`;
const ONCE = process.argv.includes("--once");
const POLL_MS = Number(process.env.POLL_MS ?? 60_000);

type Poll = {
  id: string;
  submission_id: string;
  permit_id: string;
  municipality_slug: string;
  confirmation_number: string | null;
  status: string;
};

type Correction = {
  label: string | null;
  document_path: string | null;
  raw_text: string | null;
  issued_at: string | null;
};

async function readRecord(
  page: Page,
  portalUrl: string,
  recordNumber: string,
): Promise<{ statusText: string | null; pageText: string; correctionText: string | null }> {
  // ACA's global search accepts the record number directly.
  const searchBox = page
    .locator(
      'input[id*="txtSearchCondition"], input[id*="GeneralSearch"], input[id*="PermitNumber"], input[type="search"]',
    )
    .first();
  if (!(await searchBox.count())) {
    const searchLink = page.getByRole("link", { name: /search|my records/i }).first();
    if (await searchLink.count()) {
      await searchLink.click();
      await page.waitForLoadState("domcontentloaded");
    }
  }
  const box = page
    .locator(
      'input[id*="txtSearchCondition"], input[id*="GeneralSearch"], input[id*="PermitNumber"], input[type="search"]',
    )
    .first();
  if (!(await box.count())) throw new Error("could not find the portal's record search box");
  await box.fill(recordNumber);
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    page
      .getByRole("link", { name: /^search$/i })
      .first()
      .click()
      .catch(() => page.keyboard.press("Enter")),
  ]);

  // Result list → the record itself, when the portal did not land on it directly.
  const recordLink = page.getByRole("link", { name: new RegExp(recordNumber, "i") }).first();
  if (await recordLink.count()) {
    await Promise.all([page.waitForLoadState("domcontentloaded"), recordLink.click()]);
  }

  const pageText = await page.locator("body").innerText();
  if (/no records? found|no results/i.test(pageText)) {
    throw new Error(`portal has no record matching ${recordNumber}`);
  }
  const statusText = extractStatus(pageText);
  const correctionText = looksLikeCorrection(pageText) ? pageText.slice(0, 4000) : null;
  return { statusText, pageText, correctionText };
}

/** Storage-path-safe form of a portal label or filename. */
function slugForPath(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "correction"
  );
}

/** Downloads a correction/review letter when the record page links one. */
async function downloadCorrection(
  admin: SupabaseClient,
  page: Page,
  poll: Poll,
): Promise<Correction | null> {
  const link = page
    .getByRole("link", { name: /correction|plan review comments|review letter|deficienc/i })
    .first();
  if (!(await link.count())) return null;

  const label = (await link.innerText().catch(() => null))?.trim() || "Correction notice";
  let documentPath: string | null = null;
  try {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15_000 }),
      link.click(),
    ]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const name = download.suggestedFilename() || "correction.pdf";
    // Deterministic path: the dedupe index is keyed on document_path, so a clock-stamped
    // name would let the same letter be recorded again on a later poll.
    documentPath = await uploadBytes(
      admin,
      `permits/${poll.permit_id}/corrections/${slugForPath(label)}-${slugForPath(name)}`,
      Buffer.concat(chunks),
      name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
    );
  } catch {
    // The link may open a page rather than a file; the page text still carries the
    // content, and Agent 7 works from raw_text when there is no document.
    documentPath = null;
  }
  return { label, document_path: documentPath, raw_text: null, issued_at: null };
}

async function runPoll(admin: SupabaseClient, poll: Poll) {
  // Everything after the claim runs inside the try: a poll left at 'checking' is permanent,
  // because the one-open-poll index then blocks every future enqueue for that submission.
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  let context: Awaited<ReturnType<NonNullable<typeof browser>["newContext"]>> | null = null;
  let page: Page | null = null;
  try {
    const { data: sub } = await admin
      .from("municipality_submissions")
      .select("draft, confirmation_number, tenant_id")
      .eq("id", poll.submission_id)
      .maybeSingle();

    const portalUrl = (sub?.draft as { municipality?: { portal_url?: string } } | null)
      ?.municipality?.portal_url;
    const recordNumber = poll.confirmation_number ?? sub?.confirmation_number ?? null;

    if (!portalUrl) throw new Error("submission draft has no portal_url");
    if (!recordNumber) {
      // Without a record number there is nothing to look up, and guessing would read
      // somebody else's permit.
      throw new Error("submission has no confirmation number to look up");
    }

    const creds = await portalCredentials(admin, poll.permit_id, poll.municipality_slug);
    browser = await chromium.launch({ headless: !process.env.HEADFUL });
    context = await browser.newContext({ acceptDownloads: true });
    page = await context.newPage();

    await acaLogin(page, portalUrl, creds.username, creds.password);
    const { statusText, correctionText } = await readRecord(page, portalUrl, recordNumber);
    if (!statusText) throw new Error("could not read a status from the record page");

    const shot = await page.screenshot({ fullPage: true }).catch(() => null);
    const screenshotPath = shot
      ? await uploadBytes(
          admin,
          `permits/${poll.permit_id}/status/${poll.id}-${Date.now()}.png`,
          shot,
          "image/png",
        )
      : null;

    let correction: Correction | null = null;
    if (correctionText) {
      correction = (await downloadCorrection(admin, page, poll)) ?? {
        label: "Corrections noted on the record page",
        document_path: null,
        raw_text: correctionText,
        issued_at: null,
      };
      if (!correction.raw_text) correction.raw_text = correctionText;
    }

    const { data, error } = await admin.rpc("apply_permit_status_check", {
      _poll_id: poll.id,
      _portal_status_raw: statusText,
      _screenshot_path: screenshotPath,
      _correction: correction,
    });
    if (error) throw error;
    console.log(`poll ${poll.id}: "${statusText}" → ${JSON.stringify(data)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin.rpc("fail_permit_status_check", { _poll_id: poll.id, _reason: message });
    await notifyStaff(
      admin,
      poll.permit_id,
      "permit_status_check_failed",
      `Status check failed — ${poll.municipality_slug}`,
      `${message} (the permit's status is unchanged; the next scheduled run will retry)`,
    );
    console.error(`poll ${poll.id} failed: ${message}`);
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  for (;;) {
    const poll = await claimOne<Poll>(admin, "claim_permit_status_poll", {
      _worker: WORKER,
      _slug: SLUG,
    });
    if (poll) {
      console.log(`claimed poll ${poll.id} (permit ${poll.permit_id})`);
      // One bad permit must not take the poller down with it.
      try {
        await runPoll(admin, poll);
      } catch (err) {
        console.error(`poll ${poll.id} cycle failed: ${err instanceof Error ? err.message : err}`);
      }
      continue;
    }
    if (ONCE) {
      console.log("no status polls waiting");
      return;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

if (process.argv[1]?.endsWith("permit-status-worker.ts")) {
  await main();
}
