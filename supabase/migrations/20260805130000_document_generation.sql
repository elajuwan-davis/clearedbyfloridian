-- Agent 2 — Document Generation.
--
-- Fires when a permit turns green (Agent 1's validator writes that), generates the
-- jurisdiction's fillable forms, and bundles them into a single PDF in storage.
--
-- Lovable Cloud has no Supabase dashboard for Database Webhooks, so this is a plain
-- SQL trigger calling net.http_post() through the dispatch helper introduced with
-- Agent 1 (20260805120000_intake_validator.sql).

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. Where the generated bundle lands
-- ---------------------------------------------------------------------------

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS document_bundle_path text,
  ADD COLUMN IF NOT EXISTS document_bundle_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS document_bundle_report jsonb;

-- ---------------------------------------------------------------------------
-- 2. Form field mappings
--    jurisdiction + form_type + source_field -> target_field, so a new
--    municipality's form is onboarded with rows, not code.
--    source_field is a dotted path into the generation context:
--      permit.*  (the permits row, including intake_payload.*)
--      tenant.*  (the GC's tenants row)
--      firm.*    (Cleard's own details)
--    jurisdiction '*' is the fallback applied when no municipality-specific
--    mapping exists for that form.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.form_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  form_type text NOT NULL,
  source_field text NOT NULL,
  target_field text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  fallback_value text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS form_field_mappings_unique_idx
  ON public.form_field_mappings (lower(jurisdiction), form_type, target_field);

GRANT SELECT ON public.form_field_mappings TO authenticated;
GRANT ALL ON public.form_field_mappings TO service_role;
ALTER TABLE public.form_field_mappings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'form_field_mappings'
      AND policyname = 'form_field_mappings_read'
  ) THEN
    CREATE POLICY "form_field_mappings_read" ON public.form_field_mappings
      FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'form_field_mappings'
      AND policyname = 'form_field_mappings_admin_write'
  ) THEN
    CREATE POLICY "form_field_mappings_admin_write" ON public.form_field_mappings
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Default mappings ('*' jurisdiction). Field names match the existing generators:
-- nto -> buildNtoPdfBytes (src/lib/nto-pdf.ts, snake_case NtoRow fields)
-- owner_authorization -> generateOwnerAuth (src/lib/private-provider-forms.ts, camelCase)
INSERT INTO public.form_field_mappings (jurisdiction, form_type, source_field, target_field, required, fallback_value) VALUES
  ('*', 'nto', 'permit.job_address',          'property_address',    true,  NULL),
  ('*', 'nto', 'permit.owner_name',           'owner_name',          true,  NULL),
  ('*', 'nto', 'intake.owner_address',        'owner_address',       false, NULL),
  ('*', 'nto', 'permit.poc_email',            'owner_email',         false, NULL),
  ('*', 'nto', 'permit.contractor_company',   'contractor_name',     true,  NULL),
  ('*', 'nto', 'permit.company_address',      'contractor_address',  true,  NULL),
  ('*', 'nto', 'permit.description',          'work_description',    true,  NULL),
  ('*', 'nto', 'permit.submitted_date',       'first_work_date',     false, NULL),
  ('*', 'owner_authorization', 'permit.job_address',    'propertyAddress', true,  NULL),
  ('*', 'owner_authorization', 'permit.permit_number',  'permitProjectNo', false, 'Pending assignment'),
  ('*', 'owner_authorization', 'firm.firm_name',        'firmName',        true,  NULL),
  ('*', 'owner_authorization', 'firm.private_provider', 'privateProvider', true,  NULL),
  ('*', 'owner_authorization', 'firm.telephone',        'telephone',       true,  NULL),
  ('*', 'owner_authorization', 'firm.email',            'email',           true,  NULL),
  ('*', 'owner_authorization', 'firm.license_number',   'licenseNumber',   true,  NULL)
ON CONFLICT DO NOTHING;

-- Miami pilot: the department wants the GC's own address on the NTO contractor
-- line and the qualifier named, rather than the company POC.
INSERT INTO public.form_field_mappings (jurisdiction, form_type, source_field, target_field, required, fallback_value, notes) VALUES
  ('Miami', 'nto', 'permit.contractor_qualifier', 'contractor_name', true, NULL,
   'Miami-Dade lists the licensed qualifier, not the company, on the NTO contractor line.')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Trigger: permit turned green
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_permits_document_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_edge_function(
    'document-generation',
    jsonb_build_object('permit_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_permits_document_generation ON public.permits;
CREATE TRIGGER trg_permits_document_generation
  AFTER UPDATE OF validation_status ON public.permits
  FOR EACH ROW
  WHEN (NEW.validation_status = 'green' AND OLD.validation_status IS DISTINCT FROM 'green')
  EXECUTE FUNCTION public.tg_permits_document_generation();
