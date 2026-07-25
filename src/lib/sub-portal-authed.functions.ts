// Authenticated subcontractor portal — lists permits the signed-in sub can see.
// Access is scoped by RLS via public.sub_can_see_permit() (email match on confirmed subs).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubPermitRow = {
  permitId: string;
  projectName: string;
  jobAddress: string;
  city: string | null;
  municipality: string | null;
  status: string;
  permitNumber: string | null;
  submittedDate: string | null;
  self: { trade: string; companyName: string };
};

export const listMySubPermitsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubPermitRow[]> => {
    // RLS on permits allows the sub to SELECT rows they're confirmed on.
    const { data, error } = await (context.supabase.from("permits" as any) as any)
      .select("id, project_name, job_address, city, municipality, permit_number, status, submitted_date, subs")
      .order("submitted_date", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    const email = (context.claims?.email as string | undefined)?.toLowerCase() ?? "";
    return (data ?? []).map((p: any) => {
      const subs: Array<any> = Array.isArray(p.subs) ? p.subs : [];
      const self = subs.find(
        (s) =>
          s.confirmed === true &&
          typeof s.email === "string" &&
          s.email.toLowerCase() === email,
      );
      return {
        permitId: p.id,
        projectName: p.project_name,
        jobAddress: p.job_address,
        city: p.city ?? null,
        municipality: p.municipality ?? null,
        status: p.status,
        permitNumber: p.permit_number ?? null,
        submittedDate: p.submitted_date ?? null,
        self: {
          trade: self?.trade ?? "Other",
          companyName: self?.companyName ?? "—",
        },
      };
    });
  });
