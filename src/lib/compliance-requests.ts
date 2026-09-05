/**
 * Compliance service requests (GC-facing) — frontend-only store.
 *
 * A GC asks Cleard to handle a statutory document; the request lands in the
 * admin Compliance Queue. Persisted in localStorage until the backend exists.
 */

export type ComplianceServiceKey =
  | "noc"
  | "nto"
  | "lien_release"
  | "e_recording"
  | "change_of_private_provider";

export type ComplianceRequestStatus = "Pending" | "In Progress" | "Complete";

export type ComplianceRequest = {
  id: string;
  service: ComplianceServiceKey;
  project_id: string;
  project_name: string;
  /** Service-specific answer (lien release type, document description, …). */
  detail?: string;
  notes?: string;
  status: ComplianceRequestStatus;
  submitted_at: string;
};

export type ComplianceService = {
  key: ComplianceServiceKey;
  title: string;
  description: string;
  /** Optional extra question shown in the request form. */
  field?: { label: string; options?: string[]; placeholder?: string };
};

export const COMPLIANCE_SERVICES: ComplianceService[] = [
  {
    key: "noc",
    title: "Request NOC",
    description: "Notice of Commencement filing for your project",
  },
  {
    key: "nto",
    title: "Request NTO",
    description: "Notice to Owner delivery via certified mail",
  },
  {
    key: "lien_release",
    title: "Request Lien Release",
    description: "Generate and notarize a statutory lien release",
    field: {
      label: "Release type",
      options: [
        "Partial Conditional Release",
        "Partial Unconditional Release",
        "Final / Full Conditional Release",
        "Final / Full Unconditional Release",
      ],
    },
  },
  {
    key: "e_recording",
    title: "Request E-Recording",
    description: "Submit a recorded document to the county recorder",
    field: { label: "Document to record", placeholder: "e.g. Notice of Commencement" },
  },
  {
    key: "change_of_private_provider",
    title: "Change of Private Provider",
    description: "File a change of private provider with your municipality",
  },
];

export const LIEN_RELEASE_TYPES =
  COMPLIANCE_SERVICES.find((s) => s.key === "lien_release")!.field!.options!;

export function serviceLabel(key: ComplianceServiceKey): string {
  return COMPLIANCE_SERVICES.find((s) => s.key === key)?.title.replace(/^Request /, "") ?? key;
}

const KEY = "cleard.compliance-requests.v1";

function read(): ComplianceRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ComplianceRequest[]) : [];
  } catch {
    return [];
  }
}

function write(rows: ComplianceRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* non-fatal */
  }
}

export function listComplianceRequests(): ComplianceRequest[] {
  return read().sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export function createComplianceRequest(input: {
  service: ComplianceServiceKey;
  project_id: string;
  project_name: string;
  detail?: string;
  notes?: string;
}): ComplianceRequest {
  const row: ComplianceRequest = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `cr_${Date.now()}`,
    status: "Pending",
    submitted_at: new Date().toISOString(),
    ...input,
  };
  write([row, ...read()]);
  return row;
}

export function setComplianceRequestStatus(id: string, status: ComplianceRequestStatus) {
  write(read().map((r) => (r.id === id ? { ...r, status } : r)));
}
