// Agent 3 — on-demand call into the same scope-draft edge function the
// green-transition trigger uses. Called from the intake form while the permit row
// may not exist yet, so the payload carries the description directly and nothing
// is persisted until the permit is saved.
import { supabase } from "@/integrations/supabase/client";

export type ScopeDraft = {
  concise: string;
  detailed: string;
  code_sections: string[];
  sub_permits: string[];
  missing_information: string[];
  persisted: boolean;
};

export type ScopeDraftInput = {
  permitId?: string;
  description: string;
  projectName?: string;
  permitType?: string;
  municipality?: string;
  county?: string;
  jobAddress?: string;
};

export async function draftScope(input: ScopeDraftInput): Promise<ScopeDraft> {
  const { data, error } = await supabase.functions.invoke("scope-draft", {
    body: {
      permit_id: input.permitId,
      description: input.description,
      project_name: input.projectName,
      permit_type: input.permitType,
      municipality: input.municipality,
      county: input.county,
      job_address: input.jobAddress,
    },
  });
  if (error) throw new Error(error.message);
  const res = data as ScopeDraft & { error?: string };
  if (res?.error) throw new Error(res.error);
  return res;
}
