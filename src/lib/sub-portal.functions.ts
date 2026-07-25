// Public read-only sub portal: server functions serving a confirmed
// subcontractor a sanitized view of the permit they're attached to.
//
// Access is via a per-sub UUID access token stored inside `permits.subs[]`
// (jsonb). Docs are filtered through the SUB_VISIBLE_DOC_KEYS allowlist —
// sub compliance docs (COI/W-9/License) and internal docs (NTBO,
// private-provider forms) are never surfaced.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { filterSubVisibleDocs, type PermitDoc, type PermitSub } from "@/lib/permits-api";

const TokenInput = z.object({ token: z.string().uuid() });
const DocUrlInput = z.object({ token: z.string().uuid(), path: z.string().min(1) });

export type SubPortalView = {
  permitId: string;
  projectName: string;
  jobAddress: string;
  city: string | null;
  municipality: string | null;
  permitNumber: string | null;
  status: string;
  submittedDate: string | null;
  self: {
    trade: string;
    companyName: string;
  };
  hasNoc: boolean;
  documents: PermitDoc[];
  trades: Array<{ trade: string; companyName: string }>;
};

async function findPermitAndSub(token: string): Promise<{ permit: any; sub: PermitSub } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // subs is jsonb — use a containment query for indexed lookup.
  const { data, error } = await (supabaseAdmin.from("permits" as any) as any)
    .select("id, project_name, job_address, city, municipality, permit_number, status, submitted_date, subs, documents")
    .contains("subs", [{ accessToken: token }] as any)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const sub = (data.subs as PermitSub[] | null | undefined ?? []).find((s) => s.accessToken === token);
  if (!sub) return null;
  return { permit: data, sub };
}

export const getSubProjectViewFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }): Promise<SubPortalView | null> => {
    const found = await findPermitAndSub(data.token);
    if (!found) return null;
    const { permit, sub } = found;
    if (!sub.confirmed) return null;

    const docs = filterSubVisibleDocs(permit.documents as PermitDoc[] | null | undefined);
    const hasNoc = docs.some((d) => d.key === "notice_of_commencement_review");
    const trades = (permit.subs as PermitSub[] | null | undefined ?? [])
      .filter((s) => s.confirmed && s.companyName)
      .map((s) => ({ trade: s.trade || "Other", companyName: s.companyName }));

    return {
      permitId: permit.id,
      projectName: permit.project_name,
      jobAddress: permit.job_address,
      city: permit.city ?? null,
      municipality: permit.municipality ?? null,
      permitNumber: permit.permit_number ?? null,
      status: permit.status,
      submittedDate: permit.submitted_date ?? null,
      self: { trade: sub.trade || "Other", companyName: sub.companyName },
      hasNoc,
      documents: docs,
      trades,
    };
  });

export const getSubProjectDocUrlFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DocUrlInput.parse(d))
  .handler(async ({ data }): Promise<{ url: string }> => {
    const found = await findPermitAndSub(data.token);
    if (!found) throw new Error("Invalid or expired sub portal link");
    const { permit, sub } = found;
    if (!sub.confirmed) throw new Error("Access not yet confirmed");

    // Only allow paths belonging to sub-visible docs on this permit.
    const visible = filterSubVisibleDocs(permit.documents as PermitDoc[] | null | undefined);
    const allowed = visible.some((d) => d.path === data.path);
    if (!allowed) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("permit-files")
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
