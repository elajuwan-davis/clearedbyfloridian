// Internal legal document library + NTBO templates.
// Backed by public.legal_documents + legal_document_versions and the
// private `legal-documents` Storage bucket (signed URL upload/download).
// Version history mirrors hoa_template_versions (parent pointer + child rows),
// with a real file_path per version instead of a JSONB snapshot.

import { supabase } from "@/integrations/supabase/client";

export type LegalDocType =
  | "Permit Agent Authorization"
  | "Signed PAA"
  | "NTBO Template"
  | "Terms of Service"
  | "Privacy Policy"
  | "Indemnification Agreement"
  | "Contractor Authorization Letter";

export type LegalDocStatus = "active" | "draft" | "pending_review";

export const LEGAL_STATUS_META: Record<LegalDocStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "border-emerald-600/30 bg-emerald-50 text-emerald-800" },
  draft: { label: "Draft", className: "border-obsidian/20 bg-paper-warm text-obsidian/70" },
  pending_review: { label: "Pending Review", className: "border-amber-600/30 bg-amber-50 text-amber-800" },
};

export type LegalDocVersion = {
  id: string;
  legalDocumentId: string;
  versionLabel: string;
  filePath: string;
  fileName: string | null;
  changeNotes: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type LegalDoc = {
  id: string;
  name: string;
  type: LegalDocType;
  version: string;
  updatedAt: string; // YYYY-MM-DD
  status: LegalDocStatus;
  /** Populated for executed GC copies. */
  gcName?: string;
  signedAt?: string;
  notes?: string;
};

export const LEGAL_EVT = "legal-docs:changed";

function notifyChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEGAL_EVT));
  }
}

function mapDoc(row: any): LegalDoc {
  const updated = (row.updated_at as string) ?? new Date().toISOString();
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    type: row.type as LegalDocType,
    version: (row.current_version as string) ?? "v1.0",
    updatedAt: updated.slice(0, 10),
    status: (row.status as LegalDocStatus) ?? "pending_review",
    gcName: (row.gc_name as string | null) ?? undefined,
    signedAt: row.signed_at ? String(row.signed_at).slice(0, 10) : undefined,
    notes: (row.notes as string | null) ?? undefined,
  };
}

function mapVersion(row: any): LegalDocVersion {
  return {
    id: row.id as string,
    legalDocumentId: row.legal_document_id as string,
    versionLabel: row.version_label as string,
    filePath: row.file_path as string,
    fileName: (row.file_name as string | null) ?? null,
    changeNotes: (row.change_notes as string | null) ?? null,
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string | null) ?? null,
  };
}

export async function listLegalDocs(): Promise<LegalDoc[]> {
  const { data, error } = await supabase
    .from("legal_documents")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDoc);
}

export async function listLegalDocVersions(documentId: string): Promise<LegalDocVersion[]> {
  const { data, error } = await supabase
    .from("legal_document_versions")
    .select("*")
    .eq("legal_document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapVersion);
}

export async function getCurrentVersionFilePath(doc: LegalDoc): Promise<string | null> {
  const { data, error } = await supabase
    .from("legal_document_versions")
    .select("file_path")
    .eq("legal_document_id", doc.id)
    .eq("version_label", doc.version)
    .maybeSingle();
  if (error) throw error;
  if (data?.file_path) return data.file_path as string;
  // Fallback: most recent version if labels drifted.
  const versions = await listLegalDocVersions(doc.id);
  return versions[0]?.filePath ?? null;
}

export type AddLegalDocInput = {
  id?: string;
  name: string;
  type: LegalDocType;
  version: string;
  status: LegalDocStatus;
  notes?: string;
  gcName?: string;
  signedAt?: string;
  filePath: string;
  fileName: string;
};

/** Create a legal document and its initial version row (file already uploaded). */
export async function addLegalDoc(input: AddLegalDocInput): Promise<LegalDoc> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const docPayload = {
    ...(input.id ? { id: input.id } : {}),
    name: input.name,
    type: input.type,
    current_version: input.version,
    status: input.status,
    notes: input.notes ?? null,
    gc_name: input.gcName ?? null,
    signed_at: input.signedAt ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: doc, error: docErr } = await supabase
    .from("legal_documents")
    .insert(docPayload)
    .select("*")
    .single();
  if (docErr) throw docErr;

  const { error: verErr } = await supabase.from("legal_document_versions").insert({
    legal_document_id: doc.id,
    version_label: input.version,
    file_path: input.filePath,
    file_name: input.fileName,
    change_notes: input.notes ?? "Initial upload",
    created_by: user?.id ?? null,
  });
  if (verErr) throw verErr;

  notifyChanged();
  return mapDoc(doc);
}

export type NewLegalVersionInput = {
  documentId: string;
  version: string;
  notes?: string;
  filePath: string;
  fileName: string;
};

/**
 * Insert a new version row and bump the parent's current_version pointer
 * (same pattern as hoa_templates.current_version + hoa_template_versions).
 * Marks the document pending_review.
 */
export async function newLegalVersion(input: NewLegalVersionInput): Promise<LegalDoc> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: verErr } = await supabase.from("legal_document_versions").insert({
    legal_document_id: input.documentId,
    version_label: input.version,
    file_path: input.filePath,
    file_name: input.fileName,
    change_notes: input.notes ?? null,
    created_by: user?.id ?? null,
  });
  if (verErr) throw verErr;

  const { data: doc, error: docErr } = await supabase
    .from("legal_documents")
    .update({
      current_version: input.version,
      status: "pending_review",
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.documentId)
    .select("*")
    .single();
  if (docErr) throw docErr;

  notifyChanged();
  return mapDoc(doc);
}
