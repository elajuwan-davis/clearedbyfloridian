// Reading a permit's state off an Accela record page (Agent 6).
//
// Kept out of the worker so it can be unit-tested without a browser, the same way Agent 5's
// confirmation-number parsing is. Nothing here guesses: an unrecognised page returns null
// and the caller records a failed check rather than inventing a status.

/** The record's status text, exactly as the portal words it. */
export function extractStatus(pageText: string): string | null {
  const patterns = [
    // "Record Status: Plan Review" — the colon is required, so the prose form below
    // is not matched as a status of "of this record is ...".
    /(?:record\s+)?status\s*:[ \t]*([A-Za-z][A-Za-z0-9 /&'()-]{2,60})/i,
    /status\s+of\s+(?:this\s+)?(?:record|application)\s+is\s+([A-Za-z][A-Za-z0-9 /&'()-]{2,60})/i,
  ];
  for (const re of patterns) {
    const m = pageText.match(re);
    if (m) {
      const value = m[1]
        .split("\n")[0]
        .trim()
        .replace(/\s{2,}/g, " ")
        .replace(/[.,;]+$/, "");
      if (value) return value;
    }
  }
  return null;
}

/** True when the record page says corrections are outstanding. */
export function looksLikeCorrection(text: string): boolean {
  return /correction|resubmit|revision required|plan review comments|deficien/i.test(text);
}

/**
 * Portal status text -> Cleard pipeline status. Mirrors public.map_portal_status() in
 * 20260806120000_permit_status_polling.sql; the database is authoritative (the worker
 * reports raw text and lets SQL map it), this exists so the mapping can be asserted and
 * reused in the UI.
 */
export function mapPortalStatus(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const t = raw.toLowerCase();
  if (/void|withdraw|cancel|denied/.test(t)) return "cancelled";
  if (/issued|finaled/.test(t)) return "permit_issued";
  if (/correction|resubmit|revision required|insufficient|incomplete|rejected/.test(t)) {
    return "corrections_required";
  }
  if (/ready to issue|approved|passed review/.test(t)) return "approved";
  if (/hold|suspend|pending payment|awaiting/.test(t)) return "on_hold";
  // Intake wording before review wording: "Application Accepted" is a filing that has
  // landed, not one a reviewer has picked up.
  if (/submitted|received|application accepted/.test(t)) return "submitted";
  if (/review|routed|accepted|in process|processing/.test(t)) return "in_review";
  return null;
}
