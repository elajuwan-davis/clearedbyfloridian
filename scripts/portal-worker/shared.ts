// Shared pieces of the Cleard portal workers (Agent 5 filing, Agent 6 status polling).
//
// Both workers run outside Lovable Cloud because Playwright needs a real browser binary,
// and both reach the portal the same way: the existing encrypted gc_portal_logins store
// and the same Accela Citizen Access login page. Keeping that in one place means a login
// change is fixed once.

import { createDecipheriv } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Page } from "playwright";

export const BUCKET = "permit-files";

/** AES-256-GCM, same layout as src/lib/portal-logins-crypto.server.ts writes. */
export function decryptSecret(stored: string): string {
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

/** Portal credentials for this permit's GC, from the existing encrypted store. */
export async function portalCredentials(
  admin: SupabaseClient,
  permitId: string,
  slug: string,
): Promise<{ username: string; password: string }> {
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
  let login: Login;

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

export async function uploadBytes(
  admin: SupabaseClient,
  path: string,
  bytes: Buffer,
  contentType: string,
): Promise<string | null> {
  const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) {
    console.warn(`upload of ${path} failed: ${error.message}`);
    return null;
  }
  return path;
}

export async function notifyStaff(
  admin: SupabaseClient,
  permitId: string,
  kind: string,
  title: string,
  body: string,
) {
  const { data } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const rows = (data ?? []) as Array<{ user_id: string }>;
  if (rows.length === 0) return;
  await admin
    .from("notifications")
    .insert(rows.map((r) => ({ user_id: r.user_id, kind, title, body, permit_id: permitId })));
}

/**
 * Claim RPCs return SETOF, so "no work" is zero rows. Never act on a row without an id:
 * a composite-returning function would hand back a row of NULLs instead.
 */
export async function claimOne<T extends { id?: string }>(
  admin: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<T | null> {
  const { data, error } = await admin.rpc(fn, args);
  if (error) throw error;
  const rows = (Array.isArray(data) ? data : data ? [data] : []) as T[];
  return rows.find((r) => Boolean(r?.id)) ?? null;
}

// --- Accela Citizen Access ---------------------------------------------------
//
// ACA installs share the same page structure across cities (the control ids are generated
// by Accela, not by the city), so the selectors are ACA-generic with a text fallback.
// Every step fails loudly rather than clicking blindly.

export async function acaLogin(page: Page, portalUrl: string, username: string, password: string) {
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
