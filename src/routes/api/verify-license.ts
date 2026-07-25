import { createFileRoute } from "@tanstack/react-router";

// Server route: best-effort DBPR license verification.
// DBPR does not publish a JSON API — we fetch the public license detail
// page and parse well-known field labels. On any failure we return a graceful
// "unknown" result with a link so the GC can verify manually.

const LOOKUP_URL = (ln: string) =>
  `https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=${encodeURIComponent(ln)}`;

function extractAfter(html: string, label: string): string | null {
  const re = new RegExp(`${label}[^<]*<[^>]*>\\s*([^<]+?)\\s*<`, "i");
  const m = re.exec(html);
  return m ? m[1].trim() : null;
}

function parseDate(s: string | null): string | undefined {
  if (!s) return undefined;
  const m = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(s);
  if (!m) return undefined;
  const mm = m[1].padStart(2, "0");
  const dd = m[2].padStart(2, "0");
  const yy = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${yy}-${mm}-${dd}`;
}

async function verify(licenseNumber: string) {
  const url = LOOKUP_URL(licenseNumber);
  const now = new Date().toISOString();
  const fallback = {
    license_number: licenseNumber,
    status: "unknown" as const,
    lookup_url: url,
    checked_at: now,
  };
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClearedByFloridian/1.0; +https://clearedbyfloridian.lovable.app)",
      },
    });
    if (!resp.ok) return fallback;
    const html = await resp.text();
    const holder = extractAfter(html, "Name") ?? extractAfter(html, "Licensee Name");
    const type = extractAfter(html, "License Type") ?? extractAfter(html, "Profession");
    const statusRaw = (
      extractAfter(html, "License Status") ??
      extractAfter(html, "Status") ??
      ""
    ).toLowerCase();
    const exp = parseDate(extractAfter(html, "Expires") ?? extractAfter(html, "Expiration Date"));
    let status: "active" | "expired" | "inactive" | "not_found" | "unknown" = "unknown";
    if (/current|active|clear/.test(statusRaw)) status = "active";
    else if (/expired/.test(statusRaw)) status = "expired";
    else if (/null.?and.?void|inactive|delinquent|suspended|revoked/.test(statusRaw)) status = "inactive";
    else if (!holder && !type) status = "not_found";
    return {
      license_number: licenseNumber,
      status,
      holder_name: holder || undefined,
      license_type: type || undefined,
      expiration: exp,
      lookup_url: url,
      checked_at: now,
    };
  } catch {
    return fallback;
  }
}

export const Route = createFileRoute("/api/verify-license")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const ln = (u.searchParams.get("ln") || "").trim();
        if (!ln) return new Response("Missing ln", { status: 400 });
        const result = await verify(ln);
        return Response.json(result);
      },
    },
  },
});
