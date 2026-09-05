// Server-side store for statutory lien releases (public.lien_release_documents).
//
// Named lien_release_documents, not lien_releases: the latter already exists as
// the per-subcontractor release tracker keyed by permit_id + sub_key.

import { adminDb, ApiError } from "@/lib/api-auth.server";
import type { ProjectRow } from "@/lib/api-projects.server";
import type { ReleaseType } from "@/lib/lien-release-forms.server";

export const RELEASE_BUCKET = "lien-releases";

/** Signed URL lifetime for generated + notarized PDFs. Long enough for
 *  BlueNotary to pull the document during a session. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export type ReleaseStatus = "draft" | "pending_notarization" | "notarized" | "complete";

export type LienReleaseDocument = {
  id: string;
  project_id: string;
  tenant_id: string;
  release_type: ReleaseType;
  claimant_name: string;
  claimant_address: string | null;
  owner_name: string;
  property_address: string;
  through_date: string | null;
  amount: number | null;
  status: ReleaseStatus;
  bluenotary_session_id: string | null;
  document_url: string | null;
  signed_document_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Claimant/owner/property come from the project — the caller only picks the
 *  statutory type, the through date, and the amount. */
export function releaseFieldsFromProject(project: ProjectRow) {
  return {
    claimant_name: project.contractor_company || project.contractor_qualifier || "Claimant",
    claimant_address: project.company_address,
    owner_name: project.owner_entity || project.owner_name || "Owner",
    property_address: [project.job_address, project.city].filter(Boolean).join(", "),
  };
}

export function signerFromProject(project: ProjectRow): {
  first_name: string;
  last_name: string;
  email: string;
} {
  const email = project.signer_email || project.poc_email;
  if (!email) {
    throw new ApiError(422, "Project has no signer email — add a signer or POC email first");
  }
  const parts = (project.poc || project.contractor_qualifier || project.contractor_company || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    first_name: parts[0] || "Authorized",
    last_name: parts.slice(1).join(" ") || "Signer",
    email,
  };
}

export async function loadRelease(id: string): Promise<LienReleaseDocument> {
  const { data, error } = await adminDb()
    .from("lien_release_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle<LienReleaseDocument>();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "Lien release not found");
  return data;
}

/** Tenants see their own releases; admins see all. */
export function assertReleaseAccess(
  release: LienReleaseDocument,
  caller: { tenantId: string | null; isAdmin: boolean },
): void {
  if (caller.isAdmin) return;
  if (release.tenant_id !== caller.tenantId) throw new ApiError(404, "Lien release not found");
}

export function storagePath(release: LienReleaseDocument, kind: "release" | "notarized"): string {
  return `${release.tenant_id}/${release.id}/${kind}.pdf`;
}

export async function uploadPdf(path: string, bytes: Uint8Array): Promise<string> {
  const storage = adminDb().storage.from(RELEASE_BUCKET);
  const { error } = await storage.upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new ApiError(500, `Upload failed: ${error.message}`);
  return signedUrl(path);
}

export async function signedUrl(path: string): Promise<string> {
  const { data, error } = await adminDb()
    .storage.from(RELEASE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new ApiError(500, `Could not sign document URL: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

export async function updateRelease(
  id: string,
  patch: Partial<LienReleaseDocument>,
): Promise<LienReleaseDocument> {
  const { data, error } = await adminDb()
    .from("lien_release_documents")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle<LienReleaseDocument>();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "Lien release not found");
  return data;
}
