
-- 1. INSPECTIONS
CREATE TABLE public.permit_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id uuid,
  inspection_type text NOT NULL,
  requested_date date,
  scheduled_date date,
  inspector_name text,
  result text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permit_inspections TO authenticated;
GRANT ALL ON public.permit_inspections TO service_role;
ALTER TABLE public.permit_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insp tenant read" ON public.permit_inspections FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin());
CREATE POLICY "insp tenant write" ON public.permit_inspections FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_admin());
CREATE TRIGGER trg_permit_inspections_updated BEFORE UPDATE ON public.permit_inspections
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 2. PERMIT EXPIRATION + FEE TRACKING columns on permits
ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS issued_date date,
  ADD COLUMN IF NOT EXISTS expiration_date date,
  ADD COLUMN IF NOT EXISTS extension_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_fee_cents bigint,
  ADD COLUMN IF NOT EXISTS actual_fee_cents bigint,
  ADD COLUMN IF NOT EXISTS fee_paid_date date,
  ADD COLUMN IF NOT EXISTS fee_payment_method text,
  ADD COLUMN IF NOT EXISTS homeowner_share_token uuid,
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS permits_homeowner_share_token_idx ON public.permits(homeowner_share_token) WHERE homeowner_share_token IS NOT NULL;

-- 4. HOMEOWNER PORTAL — read-only via share token
DROP POLICY IF EXISTS "permits homeowner share read" ON public.permits;
CREATE POLICY "permits homeowner share read" ON public.permits FOR SELECT TO anon
  USING (homeowner_share_token IS NOT NULL);
GRANT SELECT ON public.permits TO anon;

-- 6. RESUBMITTALS
CREATE TABLE public.permit_resubmittals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id uuid,
  version integer NOT NULL DEFAULT 1,
  correction_notes text,
  document_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  resubmitted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permit_resubmittals TO authenticated;
GRANT ALL ON public.permit_resubmittals TO service_role;
ALTER TABLE public.permit_resubmittals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resub tenant read" ON public.permit_resubmittals FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin());
CREATE POLICY "resub tenant write" ON public.permit_resubmittals FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin())
  WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_admin());

-- 7. HOA DEPOSIT tracking (adds to existing hoa_submittals table)
ALTER TABLE public.hoa_submittals
  ADD COLUMN IF NOT EXISTS deposit_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deposit_paid_date date,
  ADD COLUMN IF NOT EXISTS deposit_confirmation text;

-- 9. HubSpot draft permits — reuse permits table, no schema change needed; status='pre_check' + intake_payload flag
