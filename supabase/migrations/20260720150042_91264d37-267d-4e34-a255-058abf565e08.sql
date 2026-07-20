
-- PERMITS
CREATE TABLE public.permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  project_name text NOT NULL,
  owner_name text,
  owner_entity text,
  job_address text NOT NULL,
  city text,
  county text,
  municipality text,
  permit_type text,
  permit_number text,
  construction_value_cents bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'submitted',
  pcn text,
  description text,
  additional_notes text,
  contractor_company text,
  contractor_qualifier text,
  company_address text,
  poc text,
  poc_phone text,
  poc_email text,
  license_number text,
  signer_phone text,
  signer_email text,
  submitted_date date,
  subs jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra_docs jsonb NOT NULL DEFAULT '[]'::jsonb,
  intake_payload jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permits TO authenticated;
GRANT ALL ON public.permits TO service_role;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view all permits" ON public.permits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert permits" ON public.permits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update permits" ON public.permits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete permits" ON public.permits FOR DELETE TO authenticated USING (true);

-- SUBCONTRACTORS
CREATE TABLE public.subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  trade text,
  qualifier_name text,
  license_number text,
  license_type text,
  license_expiration date,
  license_file_path text,
  license_file_name text,
  contact_first_name text,
  contact_last_name text,
  email text,
  phone text,
  company_address text,
  insurance_carrier_name text,
  insurance_carrier_email text,
  coi_file_path text,
  coi_file_name text,
  coi_expiration date,
  w9_file_path text,
  w9_file_name text,
  completion_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'invited'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontractors TO authenticated;
GRANT ALL ON public.subcontractors TO service_role;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view all subs" ON public.subcontractors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert subs" ON public.subcontractors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update subs" ON public.subcontractors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete subs" ON public.subcontractors FOR DELETE TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER permits_touch BEFORE UPDATE ON public.permits FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER subs_touch BEFORE UPDATE ON public.subcontractors FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
