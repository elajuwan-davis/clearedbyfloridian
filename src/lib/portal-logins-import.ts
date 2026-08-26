// Pure spreadsheet → gc_portal_logins row logic, shared by the CLI
// (scripts/import-portal-logins.ts) and the in-app admin importer.
//
// Deliberately free of I/O, Supabase and crypto so it can be unit-tested without the
// service-role key: everything that decides *whether* a row is safe to import lives here,
// and the callers only encrypt and upsert what this module already approved.
//
// Nothing in this module may return a plaintext credential in a human-readable field:
// `username`/`password` are carried on the record for the CLI to encrypt, and the
// reporting fields (`city`, `status`, `reason`) never quote a credential.

import { MUNICIPALITY_TREE } from "./municipalities-data";
import { slugify } from "../../supabase/functions/_shared/submission-draft";

export type SheetRow = (string | number | boolean | null | undefined)[];

export type ColumnMap = {
  city: number;
  username: number;
  password: number;
  /** Free-text columns that may hold a note and/or the portal URL. */
  notes: number[];
  /** "Verified and added to 1password" style boolean. */
  verified?: number;
};

/** Layout of the Building Department Login workbook (city, username, password, …). */
export const DEFAULT_COLUMNS: ColumnMap = {
  city: 0,
  username: 1,
  password: 2,
  notes: [6, 7],
  verified: 5,
};

/**
 * Split delimited text (CSV, or the TSV a browser gets from a spreadsheet paste) into a
 * cell matrix. RFC4180 quoting, since a notes cell can hold a comma or a line break.
 */
export function parseDelimited(text: string, delimiter?: string): SheetRow[] {
  const body = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const sep = delimiter ?? (body.split("\n", 1)[0].includes("\t") ? "\t" : ",");
  const rows: SheetRow[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quoted) {
      if (c === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  rows.push(row);
  // A trailing newline, and rows that are entirely empty, are not data.
  return rows.filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""));
}

export type ImportRecord = {
  municipality_slug: string;
  city_name: string;
  username: string;
  password: string;
  notes: string | null;
  portal_url: string | null;
};

export type RowResult = {
  /** Row number as the operator sees it in the spreadsheet (1-based, header included). */
  line: number;
  /** Never a credential — safe to print. */
  city: string;
  status: "import" | "skip" | "error";
  reason: string;
  record?: ImportRecord;
};

/** Values that mean "there is no login here", not "this is the username". */
const PLACEHOLDERS = new Set([
  "",
  "-",
  "--",
  "n/a",
  "na",
  "none",
  "no",
  "no log on",
  "no login",
  "no log in",
  "no logon",
  "tbd",
  "unknown",
]);

const URL_RE = /\bhttps?:\/\/\S+/i;
const BARE_HOST_RE = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)+\.[a-z]{2,}(?:\/\S*)?/i;

function cell(row: SheetRow, index: number | undefined): string {
  if (index === undefined) return "";
  const value = row[index];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDERS.has(value.toLowerCase());
}

/** Two credentials crammed into one cell ("a or b") — the operator must split them. */
function isAmbiguous(value: string): boolean {
  return /\s+or\s+/i.test(value);
}

export function extractPortalUrl(text: string): string | null {
  const withScheme = text.match(URL_RE);
  if (withScheme) return withScheme[0].replace(/[),.;]+$/, "");
  const bare = text.match(BARE_HOST_RE);
  if (bare) return `https://${bare[0].replace(/[),.;]+$/, "")}`;
  return null;
}

/** The note text with any URL removed, so the URL lives in exactly one column. */
function noteWithoutUrl(text: string): string {
  return text.replace(URL_RE, " ").replace(BARE_HOST_RE, " ").replace(/\s+/g, " ").trim();
}

export type CatalogEntry = { name: string; county: string; slug: string };

export function municipalityCatalog(): CatalogEntry[] {
  const out: CatalogEntry[] = [];
  for (const region of MUNICIPALITY_TREE) {
    for (const county of region.counties) {
      for (const city of county.cities) {
        out.push({ name: city.name, county: county.name, slug: slugify(city.name) });
      }
      // Counties are jurisdictions too — several rows in the sheet are county building
      // departments, and the tree only lists some of them as a city entry.
      if (!out.some((e) => e.slug === slugify(county.name))) {
        out.push({ name: county.name, county: county.name, slug: slugify(county.name) });
      }
    }
  }
  return out;
}

/**
 * Spellings the sheet uses that are the same jurisdiction as a catalog entry. Written out
 * rather than guessed so a genuine typo still surfaces as unmatched instead of being
 * silently filed under a neighbouring city.
 */
const ALIASES: Record<string, string> = {
  "palm-beach-garden": "Palm Beach Gardens",
  "hallendale-beach": "Hallandale Beach",
  "city-of-port-saint-lucie": "Port St. Lucie",
  "port-saint-lucie": "Port St. Lucie",
  "county-of-psl": "St. Lucie County",
  "martin-co": "Martin County",
  "fort-lauderdale": "Ft. Lauderdale",
  "fort-myers": "Ft Myers",
  "miami-dade-county": "Miami-Dade",
  "miami-dade-county-rer-class-i": "Miami-Dade",
};

/** "Martin Co | Stuart" is one jurisdiction with a note attached, not two columns. */
function primaryName(city: string): string {
  return city.split(/[|/]/)[0].trim();
}

function normalizedVariants(city: string): string[] {
  const base = primaryName(city);
  const stripped = base.replace(/^(city|town|village|county)\s+of\s+/i, "").trim();
  const variants = new Set<string>([base, stripped]);
  for (const v of [base, stripped]) {
    variants.add(v.replace(/\bsaint\b/gi, "St."));
    variants.add(v.replace(/\bst\.?\b/gi, "Saint"));
    variants.add(v.replace(/\bco\.?$/i, "County"));
    variants.add(`${v} County`);
  }
  return [...variants].map((v) => slugify(v)).filter(Boolean);
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let carry = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(prev[j] + 1, prev[j - 1] + 1, carry + (a[i - 1] === b[j - 1] ? 0 : 1));
      carry = prev[j];
      prev[j] = next;
    }
  }
  return prev[b.length];
}

export type Match =
  | { kind: "matched"; entry: CatalogEntry }
  | { kind: "unmatched"; slug: string; suggestion: string | null };

/** Resolve a sheet city against the municipality catalog (src/lib/municipalities-data.ts). */
export function matchMunicipality(city: string, catalog: CatalogEntry[]): Match {
  const variants = normalizedVariants(city);
  const alias = variants.map((v) => ALIASES[v]).find(Boolean);
  const wanted = alias ? [slugify(alias)] : variants;
  for (const slug of wanted) {
    const entry = catalog.find((c) => c.slug === slug);
    if (entry) return { kind: "matched", entry };
  }
  const slug = wanted[0] ?? slugify(city);
  let suggestion: string | null = null;
  let best = Infinity;
  for (const entry of catalog) {
    const distance = editDistance(slug, entry.slug);
    if (distance < best) {
      best = distance;
      suggestion = entry.name;
    }
  }
  // Only offer a suggestion when it is close enough to be a plausible typo.
  return { kind: "unmatched", slug, suggestion: best <= 3 ? suggestion : null };
}

export type ClassifyOptions = {
  columns?: ColumnMap;
  /** Import rows whose city is not in the municipality catalog (default: report only). */
  allowUnmatched?: boolean;
};

/**
 * Turn the raw sheet into per-row decisions. Rows are never merged: the store is keyed
 * UNIQUE (user_id, municipality_slug), so a second login for the same city is reported
 * instead of overwriting the first one.
 */
export function classifyRows(rows: SheetRow[], options: ClassifyOptions = {}): RowResult[] {
  const columns = options.columns ?? DEFAULT_COLUMNS;
  const catalog = municipalityCatalog();
  const results: RowResult[] = [];
  const seen = new Map<string, number>();

  rows.forEach((row, index) => {
    const line = index + 1;
    const city = cell(row, columns.city);
    const username = cell(row, columns.username);
    const password = cell(row, columns.password);
    const hasCredential = !isPlaceholder(username) || !isPlaceholder(password);

    // The header row: labels like "Username:" in the credential columns, not a login.
    if (/^(username|password|user|login)\s*:?$/i.test(username)) return;
    if (city && isPlaceholder(city) && !hasCredential) return; // spacer row

    if (!city || isPlaceholder(city)) {
      if (hasCredential) {
        results.push({
          line,
          city: "(no city)",
          status: "error",
          reason:
            "credentials with no city — looks like a second login for the row above; " +
            "one login per city is storable, so split or drop it in the sheet",
        });
      }
      return;
    }

    if (isPlaceholder(username) || isPlaceholder(password)) {
      const missing = isPlaceholder(username)
        ? isPlaceholder(password)
          ? "username and password"
          : "username"
        : "password";
      results.push({ line, city, status: "skip", reason: `no ${missing} in the sheet` });
      return;
    }

    if (isAmbiguous(username) || isAmbiguous(password)) {
      results.push({
        line,
        city,
        status: "error",
        reason: 'cell holds two alternatives ("… or …") — pick one in the sheet first',
      });
      return;
    }

    const match = matchMunicipality(city, catalog);
    if (match.kind === "unmatched" && !options.allowUnmatched) {
      results.push({
        line,
        city,
        status: "error",
        reason:
          `not in the municipality catalog as "${match.slug}"` +
          (match.suggestion ? ` — did you mean ${match.suggestion}?` : "") +
          " (re-run with --allow-unmatched to import it anyway)",
      });
      return;
    }

    const slug = match.kind === "matched" ? match.entry.slug : match.slug;
    const cityName = match.kind === "matched" ? match.entry.name : primaryName(city);

    const previous = seen.get(slug);
    if (previous !== undefined) {
      results.push({
        line,
        city,
        status: "error",
        reason: `duplicate of row ${previous} (both resolve to "${slug}") — only one login per city can be stored`,
      });
      return;
    }
    seen.set(slug, line);

    const noteCells = columns.notes.map((i) => cell(row, i)).filter(Boolean);
    const portalUrl = noteCells.map(extractPortalUrl).find(Boolean) ?? null;
    const verified = columns.verified === undefined ? "" : cell(row, columns.verified);
    const noteParts = noteCells.map(noteWithoutUrl).filter(Boolean);
    if (verified) noteParts.push(`Verified in 1Password: ${verified.toLowerCase()}`);
    noteParts.push("Imported from the Building Department Login spreadsheet.");

    // Any other populated column is left behind on purpose: unlabeled cells in this sheet
    // have held a second username/password, and those must not land in plaintext notes.
    const mapped = new Set([
      columns.city,
      columns.username,
      columns.password,
      columns.verified,
      ...columns.notes,
    ]);
    const strays = row.map((_, i) => i).filter((i) => !mapped.has(i) && cell(row, i) !== "");

    results.push({
      line,
      city,
      status: "import",
      reason:
        strays.length > 0
          ? `ok — ignored ${strays.length} unmapped column(s); check the sheet for a second login`
          : "ok",
      record: {
        municipality_slug: slug,
        city_name: cityName,
        username,
        password,
        notes: noteParts.join(" · "),
        portal_url: portalUrl,
      },
    });
  });

  return results;
}

/** Fixed-width summary of the run. Contains city names and outcomes only. */
export function summaryTable(results: RowResult[]): string {
  const header = ["ROW", "CITY", "STATUS", "DETAIL"];
  const body = results.map((r) => [String(r.line), r.city, r.status, r.reason]);
  const widths = header.map((h, i) => Math.max(h.length, ...body.map((row) => row[i].length), 0));
  const render = (cells: string[]) =>
    cells.map((c, i) => (i === cells.length - 1 ? c : c.padEnd(widths[i]))).join("  ");
  return [render(header), render(widths.map((w) => "-".repeat(w))), ...body.map(render)].join("\n");
}
