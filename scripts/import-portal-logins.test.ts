// Unit tests for the portal-login importer.
//
//   bun run test:import-portal-logins
//
// No hosted Supabase and no real credentials: the client is a stub that records what would
// have been written, and the encryption key is a throwaway generated here. This is the
// scripts/local-test/ pattern — the real import is run by a human with the real secrets.

import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

process.env.APP_USER_CONNECTION_KEY_SECRET ??= randomBytes(32).toString("base64");

const {
  classifyRows,
  matchMunicipality,
  municipalityCatalog,
  extractPortalUrl,
  parseDelimited,
  summaryTable,
} = await import("../src/lib/portal-logins-import");
const { isInternalEmail } = await import("../src/lib/portal-logins-access.server");
const { resolveOwner, upsertPayload } = await import("./import-portal-logins");
const { encryptSecret, decryptSecret } = await import("../src/lib/portal-logins-crypto.server");

const HEADER = ["-", "Username:", "Password:", "Contact:", "Verified and added to 1password"];

const row = (
  city: string,
  username = "user@example.com",
  password = "pw",
  extra: Record<number, string> = {},
) => {
  const cells: string[] = [city, username, password, "", "", "", "", ""];
  for (const [index, value] of Object.entries(extra)) cells[Number(index)] = value;
  return cells;
};

test("a complete row becomes an importable record on the catalog's slug", () => {
  const [result] = classifyRows([
    row("Plantation", "u", "p", { 7: "https://aca.plantation.org/CitizenAccess/Default.aspx" }),
  ]);
  assert.equal(result.status, "import");
  assert.equal(result.record?.municipality_slug, "plantation");
  assert.equal(result.record?.city_name, "Plantation");
  assert.equal(result.record?.portal_url, "https://aca.plantation.org/CitizenAccess/Default.aspx");
});

test("the header and spacer rows are dropped, not reported as cities", () => {
  const results = classifyRows([HEADER, ["", "", ""], ["-", "", ""], row("Plantation")]);
  assert.deepEqual(
    results.map((r) => r.city),
    ["Plantation"],
  );
});

test("a row with no username or no password is skipped, not half-imported", () => {
  const results = classifyRows([row("Miramar", "u", ""), row("Coral Springs", "", "p")]);
  assert.deepEqual(
    results.map((r) => r.status),
    ["skip", "skip"],
  );
  assert.equal(results[0].reason, "no password in the sheet");
  assert.equal(results[1].reason, "no username in the sheet");
});

test('"no log on" is treated as absent, not as a username', () => {
  const [result] = classifyRows([row("Doral", "no log on", "no log on")]);
  assert.equal(result.status, "skip");
  assert.match(result.reason, /no username and password/);
});

test("two alternatives in one cell are an error, not a coin flip", () => {
  const [result] = classifyRows([row("Doral", "u", "first or second")]);
  assert.equal(result.status, "error");
  assert.match(result.reason, /two alternatives/);
});

test("credentials with no city are reported instead of attached to the row above", () => {
  const results = classifyRows([row("Greenacres"), row("", "second@example.com", "pw")]);
  assert.equal(results[1].status, "error");
  assert.equal(results[1].city, "(no city)");
  assert.match(results[1].reason, /second login for the row above/);
});

test("two rows resolving to the same city are an error, so neither is silently overwritten", () => {
  const results = classifyRows([row("City of Port Saint Lucie"), row("Port Saint Lucie")]);
  assert.equal(results[0].status, "import");
  assert.equal(results[1].status, "error");
  assert.match(results[1].reason, /duplicate of row 1/);
});

test("an unknown city is refused by default and imported only when asked", () => {
  const sheet = [row("ProjectDocx")];
  assert.equal(classifyRows(sheet)[0].status, "error");
  const allowed = classifyRows(sheet, { allowUnmatched: true })[0];
  assert.equal(allowed.status, "import");
  assert.equal(allowed.record?.municipality_slug, "projectdocx");
});

test("a near-miss city name is refused with the catalog spelling suggested", () => {
  const [result] = classifyRows([row("Palm Beach Gardenss")]);
  assert.equal(result.status, "error");
  assert.match(result.reason, /did you mean Palm Beach Gardens\?/);
});

test("known sheet spellings resolve to the catalog entry", () => {
  const catalog = municipalityCatalog();
  for (const [sheetName, expected] of [
    ["Palm Beach Garden", "Palm Beach Gardens"],
    ["Hallendale Beach ", "Hallandale Beach"],
    ["Martin Co | Stuart", "Martin County"],
    ["City of Port Saint Lucie", "Port St. Lucie"],
    ["Weston ", "Weston"],
  ] as const) {
    const match = matchMunicipality(sheetName, catalog);
    assert.equal(match.kind, "matched", `${sheetName} should match the catalog`);
    assert.equal(match.kind === "matched" ? match.entry.name : "", expected);
  }
});

test("a bare host in the notes column becomes an https URL", () => {
  assert.equal(extractPortalUrl("energovpub.tylerhost.net"), "https://energovpub.tylerhost.net");
  assert.equal(
    extractPortalUrl("Martin County https://aca-prod.accela.com/MARTINCO/Default.aspx"),
    "https://aca-prod.accela.com/MARTINCO/Default.aspx",
  );
  assert.equal(extractPortalUrl("Password needs to be updated"), null);
});

test("notes keep the sheet's remarks and never a credential from an unmapped column", () => {
  // Column 4 in the real sheet has held a second password.
  const [result] = classifyRows([
    row("Boca Raton", "u", "p", { 3: "EHub Boca", 4: "secondpassword", 5: "True", 7: "note text" }),
  ]);
  assert.equal(result.status, "import");
  assert.doesNotMatch(result.record?.notes ?? "", /secondpassword|EHub Boca/);
  assert.match(result.record?.notes ?? "", /note text/);
  assert.match(result.record?.notes ?? "", /Verified in 1Password: true/);
  assert.match(result.reason, /ignored 2 unmapped column/);
});

test("the summary table quotes no credential", () => {
  const table = summaryTable(classifyRows([row("Plantation", "secretuser", "secretpw")]));
  assert.doesNotMatch(table, /secretuser|secretpw/);
  assert.match(table, /Plantation/);
});

test("the payload matches savePortalLogin's shape and round-trips through the app's crypto", () => {
  const [result] = classifyRows([row("Plantation", "vault-user", "vault-pass")]);
  const payload = upsertPayload(result.record!, { userId: "u1", tenantId: "t1" }, encryptSecret);
  assert.deepEqual(Object.keys(payload).sort(), [
    "city_name",
    "derm",
    "e_plan",
    "municipality_slug",
    "notes",
    "password_ciphertext",
    "portal_url",
    "registration",
    "tenant_id",
    "updated_at",
    "user_id",
    "username_ciphertext",
  ]);
  assert.notEqual(payload.username_ciphertext, "vault-user");
  assert.equal(decryptSecret(payload.username_ciphertext), "vault-user");
  assert.equal(decryptSecret(payload.password_ciphertext), "vault-pass");
});

function stubClient(tables: Record<string, unknown[]>): SupabaseClient {
  return {
    from(table: string) {
      const chain = {
        rows: tables[table] ?? [],
        select() {
          return chain;
        },
        ilike(_column: string, _value: string) {
          return chain;
        },
        eq(_column: string, _value: string) {
          return chain;
        },
        limit() {
          return Promise.resolve({ data: chain.rows, error: null });
        },
        then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
          return Promise.resolve({ data: chain.rows, error: null }).then(resolve);
        },
      };
      return chain;
    },
  } as unknown as SupabaseClient;
}

test("the owning user is resolved by email, with the tenant taken from membership", async () => {
  const admin = stubClient({
    profiles: [{ id: "user-1", email: "gc@example.com" }],
    tenant_members: [{ tenant_id: "tenant-1" }],
  });
  assert.deepEqual(await resolveOwner(admin, { userEmail: "gc@example.com" }), {
    userId: "user-1",
    tenantId: "tenant-1",
  });
});

test("an ambiguous owner is refused rather than guessed", async () => {
  await assert.rejects(
    () => resolveOwner(stubClient({ profiles: [] }), { userEmail: "nobody@example.com" }),
    /no profile with email/,
  );
  await assert.rejects(
    () =>
      resolveOwner(
        stubClient({
          profiles: [{ id: "user-1" }],
          tenant_members: [{ tenant_id: "a" }, { tenant_id: "b" }],
        }),
        { userEmail: "gc@example.com" },
      ),
    /pass --tenant-id/,
  );
});

test("pasted delimited text keeps quoted commas and newlines in one cell", () => {
  const rows = parseDelimited(
    'City,Username,Password\r\nPlantation,u,p\r\n"Fort Lauderdale",u2,"p,2"\r\n\r\n',
  );
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[2], ["Fort Lauderdale", "u2", "p,2"]);
});

test("a spreadsheet paste (tab-separated) is detected without being told", () => {
  const rows = parseDelimited("Plantation\tu\tp");
  assert.deepEqual(rows, [["Plantation", "u", "p"]]);
});

test("pasted text classifies the same way a workbook does", () => {
  const results = classifyRows(
    parseDelimited("City,Username,Password\nPlantation,u,p\nMiramar,u,\n"),
  );
  assert.deepEqual(
    results.map((r) => `${r.city}:${r.status}`),
    ["Plantation:import", "Miramar:skip"],
  );
});

test("only Cleard's own accounts count as internal owners", () => {
  for (const email of ["eman@cleared.com", "EMAN@Floridianinc.com "]) {
    assert.equal(isInternalEmail(email), true, email);
  }
  for (const email of [null, "", "gc@customer.com", "someone@notcleared.com", "cleared.com"]) {
    assert.equal(isInternalEmail(email), false, String(email));
  }
});
