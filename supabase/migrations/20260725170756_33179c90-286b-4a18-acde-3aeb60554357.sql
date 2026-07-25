
CREATE TABLE public.hoa_submittals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  created_by uuid,
  permit_id uuid REFERENCES public.permits(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'boilerplate',
  status text NOT NULL DEFAULT 'draft',
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  property_address text,
  lot text,
  block text,
  plat_name text,
  hoa_name text,
  community_name text,
  village_name text,
  model_type text,
  project_type text,
  project_description text,
  scope_of_work text,
  contractor_name text,
  contractor_license text,
  estimated_start_date date,
  deposit_amount_cents bigint NOT NULL DEFAULT 0,
  coi_attached boolean NOT NULL DEFAULT false,
  plans_attached boolean NOT NULL DEFAULT false,
  extracted_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  missing_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  uploaded_form_path text,
  generated_pdf_path text,
  removal_agreement_path text,
  removal_agreement_signed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoa_submittals TO authenticated;
GRANT ALL ON public.hoa_submittals TO service_role;

ALTER TABLE public.hoa_submittals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all HOA submittals"
  ON public.hoa_submittals FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Tenant members view HOA submittals"
  ON public.hoa_submittals FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant members insert HOA submittals"
  ON public.hoa_submittals FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND (public.has_role(auth.uid(), 'gc_owner'::public.app_role)
         OR public.has_role(auth.uid(), 'gc_member'::public.app_role))
  );

CREATE POLICY "Tenant members update HOA submittals"
  ON public.hoa_submittals FOR UPDATE
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant owners delete HOA submittals"
  ON public.hoa_submittals FOR DELETE
  TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND public.has_role(auth.uid(), 'gc_owner'::public.app_role)
  );

CREATE INDEX hoa_submittals_tenant_idx ON public.hoa_submittals(tenant_id);
CREATE INDEX hoa_submittals_permit_idx ON public.hoa_submittals(permit_id);
CREATE INDEX hoa_submittals_status_idx ON public.hoa_submittals(status);

CREATE TRIGGER hoa_submittals_touch_updated_at
  BEFORE UPDATE ON public.hoa_submittals
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
