// "Project" in the REST API is a row in public.permits.

import { adminDb, ApiError, type Caller } from "@/lib/api-auth.server";

export type ProjectRow = {
  id: string;
  tenant_id: string | null;
  project_name: string | null;
  job_address: string | null;
  city: string | null;
  owner_name: string | null;
  owner_entity: string | null;
  contractor_company: string | null;
  contractor_qualifier: string | null;
  company_address: string | null;
  poc: string | null;
  poc_email: string | null;
  signer_email: string | null;
};

const PROJECT_FIELDS =
  "id, tenant_id, project_name, job_address, city, owner_name, owner_entity, contractor_company, contractor_qualifier, company_address, poc, poc_email, signer_email";

export async function loadProject(projectId: string): Promise<ProjectRow> {
  const { data, error } = await adminDb()
    .from("permits")
    .select(PROJECT_FIELDS)
    .eq("id", projectId)
    .maybeSingle<ProjectRow>();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "Project not found");
  return data;
}

/** Load a project the caller is allowed to act on. */
export async function loadOwnProject(projectId: string, caller: Caller): Promise<ProjectRow> {
  const project = await loadProject(projectId);
  if (!caller.isAdmin && project.tenant_id !== caller.tenantId) {
    throw new ApiError(404, "Project not found");
  }
  return project;
}
