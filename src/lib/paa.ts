// Permit Agent Authorization (PAA) — one-time document GCs sign at onboarding.
// Placeholder language pending attorney review. Stored locally; swap `read`/`write`
// for a server function + SignWell webhook when the provider is wired.

export const PAA_VERSION = "v0.9 (draft)";
export const PAA_DRAFT_NOTICE = "DRAFT — PENDING ATTORNEY REVIEW";

export const PAA_TITLE = "Permit Agent Authorization";

export const PAA_BODY: Array<{ heading: string; body: string }> = [
  {
    heading: "1. Appointment of Authorized Agent",
    body:
      "The undersigned general contractor (\"Contractor\") appoints Cléared, the private provider permitting division of Flōridian LLC (\"Cléared\"), as its authorized permit agent for all building permit activity undertaken on Contractor's behalf in the State of Florida. This appointment remains in effect until revoked in writing by Contractor.",
  },
  {
    heading: "2. Scope of Authority",
    body:
      "Contractor authorizes Cléared to (a) prepare, sign, and submit permit applications and supporting documents as authorized agent of record; (b) prepare, execute, and file Notices to Owner and Notices to Builder/Owner (NTBO) on Contractor's behalf; (c) communicate directly with building departments, plan reviewers, inspection coordinators, and other municipal officials regarding Contractor's projects; and (d) receive issued permits, permit cards, correction notices, and inspection results on Contractor's behalf.",
  },
  {
    heading: "3. Contractor Responsibilities",
    body:
      "Contractor remains the licensed qualifier of record for all permitted work and retains sole responsibility for means, methods, code compliance in the field, and payment of all municipal fees. Contractor agrees to provide accurate project information, current license and insurance documentation, and signed and sealed construction documents in a timely manner.",
  },
  {
    heading: "4. Private Provider Services",
    body:
      "Where Contractor elects private provider plan review or inspection services pursuant to Section 553.791, Florida Statutes, Cléared will furnish the statutory notice to the local building official and perform 2-day plan review and same-day inspections through duly licensed personnel.",
  },
  {
    heading: "5. Fees and Authorization to Charge",
    body:
      "Contractor authorizes Cléared to advance municipal permit and plan review fees on Contractor's behalf and to charge those amounts, together with Cléared's service fees, to the payment method on file under Contractor's Payment Authorization.",
  },
  {
    heading: "6. Limitation of Authority",
    body:
      "This authorization does not empower Cléared to enter into construction contracts, waive lien rights, settle claims, or bind Contractor to any obligation unrelated to permit administration.",
  },
  {
    heading: "7. Term and Revocation",
    body:
      "This authorization is effective on the date signed below and continues until revoked. Revocation does not affect permits already applied for or issued prior to the effective date of revocation.",
  },
];

export type PaaRecord = {
  version: string;
  signerName: string;
  signerEmail: string;
  signedAt: string; // ISO
  provider: "SignWell";
  envelopeId: string;
};

const PAA_KEY = "cleared.paa.v1";
const TOS_KEY = "cleared.tosAccepted.v1";
export const PAA_EVT = "paa:changed";

export function loadPaa(): PaaRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PAA_KEY);
    return raw ? (JSON.parse(raw) as PaaRecord) : null;
  } catch {
    return null;
  }
}

export function savePaa(input: { signerName: string; signerEmail: string }): PaaRecord {
  const rec: PaaRecord = {
    version: PAA_VERSION,
    signerName: input.signerName.trim(),
    signerEmail: input.signerEmail.trim(),
    signedAt: new Date().toISOString(),
    provider: "SignWell",
    envelopeId: `SW-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
  };
  window.localStorage.setItem(PAA_KEY, JSON.stringify(rec));
  window.dispatchEvent(new CustomEvent(PAA_EVT));
  return rec;
}

export function loadTosAccepted(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOS_KEY);
}

export function acceptTos(): string {
  const at = new Date().toISOString();
  window.localStorage.setItem(TOS_KEY, at);
  window.dispatchEvent(new CustomEvent(PAA_EVT));
  return at;
}

/** Plain-text rendering used for the download link. */
export function paaPlainText(rec?: PaaRecord | null): string {
  const lines = [
    `CLÉARED — ${PAA_TITLE.toUpperCase()}`,
    `Version ${PAA_VERSION} — ${PAA_DRAFT_NOTICE}`,
    "",
    ...PAA_BODY.flatMap((s) => [s.heading, s.body, ""]),
  ];
  if (rec) {
    lines.push(
      "EXECUTION",
      `Signed by: ${rec.signerName} (${rec.signerEmail})`,
      `Signed at: ${new Date(rec.signedAt).toLocaleString("en-US")}`,
      `E-signature provider: ${rec.provider} · Envelope ${rec.envelopeId}`,
    );
  }
  return lines.join("\n");
}

export function downloadPaa(rec?: PaaRecord | null) {
  if (typeof window === "undefined") return;
  const blob = new Blob([paaPlainText(rec)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cleared-permit-agent-authorization.txt";
  a.click();
  URL.revokeObjectURL(url);
}
