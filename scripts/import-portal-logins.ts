// One-off importer: a spreadsheet of building-department portal logins -> gc_portal_logins.
//
//   bun run import-portal-logins -- <file.xlsx|file.csv> --user-email=gc@example.com [--apply]
//
// Runs on an operator's machine, not on Lovable: it needs SUPABASE_SERVICE_ROLE_KEY and
// APP_USER_CONNECTION_KEY_SECRET. See scripts/import-portal-logins.md.
//
// Safety rules this file must keep:
//   * a plaintext username or password is never printed, logged or put in an error message;
//   * the encryption is the app's existing encryptSecret(), not a second implementation;
//   * writes go through the same upsert shape/conflict target as savePortalLogin();
//   * nothing is written unless --apply is passed (a dry run is the default).

import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { encryptSecret } from "../src/lib/portal-logins-crypto.server";
import {
  classifyRows,
  summaryTable,
  type RowResult,
  type SheetRow,
} from "./import-portal-logins/rows";

type Args = {
  file: string;
  userEmail?: string;
  userId?: string;
  tenantId?: string;
  apply: boolean;
  allowUnmatched: boolean;
  sheet?: string;
};

function usage(message: string): never {
  console.error(
    [
      `error: ${message}`,
      "",
      "usage: bun run import-portal-logins -- <file.xlsx|file.csv> [options]",
      "",
      "  --user-email=<email>  GC whose vault the logins belong to (looked up in profiles)",
      "  --user-id=<uuid>      use instead of --user-email",
      "  --tenant-id=<uuid>    override the tenant (default: the user's tenant_members row)",
      "  --sheet=<name>        worksheet to read (default: the first one)",
      "  --allow-unmatched     import cities that are not in the municipality catalog",
      "  --apply               actually write; without it the script only reports",
    ].join("\n"),
  );
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags = new Map<string, string>();
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      flags.set(key, value ?? "true");
    } else positional.push(arg);
  }
  if (positional.length !== 1) usage("expected exactly one spreadsheet path");
  const args: Args = {
    file: positional[0],
    userEmail: flags.get("user-email"),
    userId: flags.get("user-id"),
    tenantId: flags.get("tenant-id"),
    apply: flags.get("apply") === "true",
    allowUnmatched: flags.get("allow-unmatched") === "true",
    sheet: flags.get("sheet"),
  };
  if (!args.userEmail && !args.userId) usage("one of --user-email or --user-id is required");
  return args;
}

/** Read the sheet as a matrix of cells. Format comes from the extension, per spec. */
export function readSheet(file: string, sheetName?: string): SheetRow[] {
  const ext = extname(file).toLowerCase();
  if (![".xlsx", ".xls", ".xlsm", ".csv"].includes(ext)) {
    throw new Error(`unsupported file type "${ext || basename(file)}" — use .xlsx or .csv`);
  }
  const raw = readFileSync(file);
  const book =
    ext === ".csv"
      ? XLSX.read(raw.toString("utf8"), { type: "string", raw: true })
      : XLSX.read(raw, { type: "buffer" });
  const name = sheetName ?? book.SheetNames[0];
  const sheet = book.Sheets[name];
  if (!sheet) {
    throw new Error(`worksheet "${name}" not found (available: ${book.SheetNames.join(", ")})`);
  }
  return XLSX.utils.sheet_to_json<SheetRow>(sheet, { header: 1, blankrows: false, defval: "" });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — this script must run with the service-role secrets`);
  }
  return value;
}

/** Resolve which vault the rows belong to. Asks nothing of the sheet: it has no owner column. */
export async function resolveOwner(
  admin: SupabaseClient,
  args: Pick<Args, "userEmail" | "userId" | "tenantId">,
): Promise<{ userId: string; tenantId: string | null }> {
  let userId = args.userId ?? null;
  if (!userId && args.userEmail) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", args.userEmail)
      .limit(2);
    if (error) throw new Error(`profiles lookup failed: ${error.message}`);
    const rows = data ?? [];
    if (rows.length === 0) throw new Error(`no profile with email ${args.userEmail}`);
    if (rows.length > 1) throw new Error(`${args.userEmail} matches more than one profile`);
    userId = (rows[0] as { id: string }).id;
  }
  if (!userId) throw new Error("could not determine the owning user");

  if (args.tenantId) return { userId, tenantId: args.tenantId };

  const { data: members, error: memberError } = await admin
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId);
  if (memberError) throw new Error(`tenant_members lookup failed: ${memberError.message}`);
  const tenantIds = [
    ...new Set((members ?? []).map((m) => (m as { tenant_id: string }).tenant_id)),
  ];
  if (tenantIds.length > 1) {
    throw new Error(
      `that user belongs to ${tenantIds.length} tenants — pass --tenant-id to say which one`,
    );
  }
  return { userId, tenantId: tenantIds[0] ?? null };
}

/** The row savePortalLogin() would have written, with both secrets already encrypted. */
export function upsertPayload(
  result: Required<Pick<RowResult, "record">>["record"],
  owner: { userId: string; tenantId: string | null },
  encrypt: (plaintext: string) => string,
) {
  return {
    user_id: owner.userId,
    tenant_id: owner.tenantId,
    municipality_slug: result.municipality_slug,
    city_name: result.city_name,
    username_ciphertext: encrypt(result.username),
    password_ciphertext: encrypt(result.password),
    notes: result.notes,
    portal_url: result.portal_url,
    registration: null,
    e_plan: false,
    derm: false,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = requireEnv("SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("APP_USER_CONNECTION_KEY_SECRET");

  const rows = readSheet(args.file, args.sheet);
  const results = classifyRows(rows, { allowUnmatched: args.allowUnmatched });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const owner = await resolveOwner(admin, args);

  const importable = results.filter((r) => r.status === "import" && r.record);
  if (args.apply) {
    for (const result of importable) {
      const payload = upsertPayload(result.record!, owner, encryptSecret);
      const { error } = await admin
        .from("gc_portal_logins")
        .upsert(payload, { onConflict: "user_id,municipality_slug" });
      if (error) {
        // Report the city, never the payload: the payload carries ciphertext but the
        // Supabase error can echo the request body back.
        result.status = "error";
        result.reason = `upsert failed for ${result.city}`;
        console.error(`upsert failed for ${result.city}: ${error.message.slice(0, 200)}`);
      }
    }
  }

  console.log(summaryTable(results));
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(
    `\n${args.apply ? "imported" : "would import"}: ${counts.import ?? 0}` +
      `   skipped: ${counts.skip ?? 0}   errors: ${counts.error ?? 0}`,
  );
  if (!args.apply) console.log("dry run — re-run with --apply to write these rows.");
  if ((counts.error ?? 0) > 0) process.exitCode = 1;
}

// Only run when invoked directly, so the helpers above stay unit-testable.
if (process.argv[1] && /^import-portal-logins\.(ts|js|mjs)$/.test(basename(process.argv[1]))) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
