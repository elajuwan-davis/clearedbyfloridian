#!/usr/bin/env bun
// Updates one row of the "Features" tab in the Cleard Feature Build spreadsheet.
//
//   bun run feature-tracker -- --feature="Voice-to-form fill" --status="In Progress" \
//     --owner=devin-abc123 [--started=2026-08-27] [--completed=2026-08-28] [--notes="…"]
//
// Rows are matched on the Feature Name column (exact, case-insensitive). The tab is
// the source of truth for what is built; see docs/feature-tracker.md.
//
// Needs GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON (the same service account used for permit
// data) in the environment. The account needs edit access to the spreadsheet.
import { createSign } from "node:crypto";

const SPREADSHEET_ID = "1mq9Xyk_rHylcsNw50QRq36lX97mUT1kLeHxmUrV3OMc";
const TAB = "Features";
const STATUSES = ["Not Started", "In Progress", "Complete", "Killed"] as const;
type Status = (typeof STATUSES)[number];

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function accessToken(): Promise<string> {
  const raw = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON");
  const key = JSON.parse(raw) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const jwt = `${unsigned}.${base64url(signer.sign(key.private_key))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!body.access_token)
    throw new Error(`Token request failed: ${body.error_description ?? res.status}`);
  return body.access_token;
}

async function sheets(token: string, path: string, init?: RequestInit) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );
  if (!res.ok)
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

const feature = arg("feature");
const status = arg("status") as Status | undefined;
const owner = arg("owner");
const notes = arg("notes");
const today = new Date().toISOString().slice(0, 10);
const startedArg = arg("started");
const completedArg = arg("completed");

if (!feature || !status) {
  console.error(
    'Usage: --feature="Exact feature name" --status="In Progress" [--owner=… --started=… --completed=… --notes=…]',
  );
  process.exit(1);
}
if (!STATUSES.includes(status)) {
  console.error(`--status must be one of: ${STATUSES.join(", ")}`);
  process.exit(1);
}

const token = await accessToken();
const read = (await sheets(token, `/values/${TAB}!A1:H500`)) as { values?: string[][] };
const rows = read.values ?? [];
const index = rows.findIndex(
  (r) => (r[0] ?? "").trim().toLowerCase() === feature.trim().toLowerCase(),
);
if (index < 1) {
  console.error(
    `No row named "${feature}" in the ${TAB} tab — check the exact roadmap wording before adding a new row.`,
  );
  process.exit(1);
}

const row = rows[index];
const rowNumber = index + 1;

// Notes carry the evidence a Complete row is only allowed to claim with: a merged PR,
// a commit or a file. Stored evidence counts, so an owner-only edit need not repeat it.
if (status === "Complete" && !(notes ?? row[7] ?? "").trim()) {
  console.error(
    `"${row[0]}" cannot be Complete with an empty Notes cell — pass --notes with the PR, commit or file that shipped it.`,
  );
  process.exit(1);
}

// A milestone date is stamped when the row first enters that status; re-running the same
// status to fix an owner or a note must not move the date it already recorded.
const started =
  startedArg ?? (status === "In Progress" && !(row[4] ?? "").trim() ? today : undefined);
const completed =
  completedArg ?? (status === "Complete" && !(row[5] ?? "").trim() ? today : undefined);

// Only the cells this invocation actually changes are written, so two agents editing
// different columns of one feature cannot overwrite each other from a stale read.
const updates: Array<{ range: string; values: string[][] }> = [];
const set = (column: string, value: string | undefined) => {
  if (value !== undefined)
    updates.push({ range: `${TAB}!${column}${rowNumber}`, values: [[value]] });
};
set("C", status);
set("D", owner);
set("E", started);
set("F", completed);
set("H", notes);

await sheets(token, "/values:batchUpdate", {
  method: "POST",
  body: JSON.stringify({ valueInputOption: "RAW", data: updates }),
});
console.log(
  `Row ${rowNumber} updated: ${row[0]} → ${status}${owner ? ` (${owner})` : ""} [${updates.map((u) => u.range.split("!")[1]).join(", ")}]`,
);
