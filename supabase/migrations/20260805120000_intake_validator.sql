-- Agent 1 — Intake Validator.
--
-- Runs on every new `permits` row: resolves the address/jurisdiction, re-checks the
-- GC's DBPR license, GC insurance, Cléared's municipal registration, and the PAA on
-- file. Result lands on permits.validation_status / validation_report.
--
-- This project runs on Lovable Cloud — there is no Supabase dashboard to register a
-- "Database Webhook" in, so the trigger is plain SQL calling net.http_post(), the same
-- shape as the pg_cron/pg_net jobs already live for COI, lien notices, and utility locates.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. Validation result columns on permits
-- ---------------------------------------------------------------------------

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS validation_status text
    CHECK (validation_status IN ('green', 'amber', 'red')),
  ADD COLUMN IF NOT EXISTS validation_report jsonb,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

CREATE INDEX IF NOT EXISTS permits_validation_status_idx
  ON public.permits (validation_status);

-- ---------------------------------------------------------------------------
-- 2. Cléared's own municipality registrations
--    Nothing tracked this before — private-provider/agent registration status per
--    building department. Org-wide (Cléared, not per tenant), so staff-managed.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.municipality_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality text NOT NULL,
  county text,
  registration_type text NOT NULL DEFAULT 'permit_agent'
    CHECK (registration_type IN ('permit_agent', 'private_provider', 'contractor_of_record')),
  registration_number text,
  registered_on date,
  expires_on date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'lapsed', 'not_required')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS municipality_registrations_unique_idx
  ON public.municipality_registrations (lower(municipality), registration_type);

GRANT SELECT ON public.municipality_registrations TO authenticated;
GRANT ALL ON public.municipality_registrations TO service_role;
ALTER TABLE public.municipality_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'municipality_registrations'
      AND policyname = 'municipality_registrations_read'
  ) THEN
    CREATE POLICY "municipality_registrations_read" ON public.municipality_registrations
      FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'municipality_registrations'
      AND policyname = 'municipality_registrations_admin_write'
  ) THEN
    CREATE POLICY "municipality_registrations_admin_write" ON public.municipality_registrations
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. GC (not sub) insurance
--    coi_records covers subcontractor/permit-scoped COIs only, and gc_coi_minimums
--    stores required limits — neither holds the GC's own live policies. The GC
--    company profile that does (src/lib/gc-company.ts) is localStorage-only.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.gc_insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  coverage_type text NOT NULL
    CHECK (coverage_type IN ('general_liability', 'workers_comp', 'auto', 'umbrella', 'bond')),
  carrier_name text,
  policy_number text,
  coverage_amount_cents bigint,
  effective_date date,
  expiration_date date NOT NULL,
  document_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gc_insurance_tenant_coverage_idx
  ON public.gc_insurance_policies (tenant_id, coverage_type, expiration_date DESC);

-- Status is derived, not stored: a STORED generated column over CURRENT_DATE is
-- rejected by Postgres ("generation expression is not immutable"), so callers read
-- this view — or compute from expiration_date directly.
CREATE OR REPLACE VIEW public.gc_insurance_policy_status AS
  SELECT
    p.*,
    CASE
      WHEN p.expiration_date < CURRENT_DATE THEN 'expired'
      WHEN p.expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'active'
    END AS status
  FROM public.gc_insurance_policies p;

GRANT SELECT ON public.gc_insurance_policy_status TO authenticated;
GRANT SELECT ON public.gc_insurance_policy_status TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gc_insurance_policies TO authenticated;
GRANT ALL ON public.gc_insurance_policies TO service_role;
ALTER TABLE public.gc_insurance_policies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gc_insurance_policies'
      AND policyname = 'gc_insurance_tenant_access'
  ) THEN
    CREATE POLICY "gc_insurance_tenant_access" ON public.gc_insurance_policies
      FOR ALL TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id())
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. PAA signatures
--    src/lib/paa.ts holds the document text plus a localStorage record
--    (version, signerName, signerEmail, signedAt, provider, envelopeId) and
--    paa-sign-dialog.tsx gates onboarding on it — but nothing persists server
--    side, so the validator had nothing to read. Same shape, in Postgres.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.paa_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version text NOT NULL,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  provider text NOT NULL DEFAULT 'SignWell',
  envelope_id text,
  document_path text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS paa_signatures_tenant_idx
  ON public.paa_signatures (tenant_id, signed_at DESC);

GRANT SELECT, INSERT ON public.paa_signatures TO authenticated;
GRANT ALL ON public.paa_signatures TO service_role;
ALTER TABLE public.paa_signatures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'paa_signatures'
      AND policyname = 'paa_signatures_tenant_access'
  ) THEN
    CREATE POLICY "paa_signatures_tenant_access" ON public.paa_signatures
      FOR ALL TO authenticated
      USING (public.is_admin() OR tenant_id = public.current_tenant_id())
      WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Edge function dispatch helpers (pg_net)
--    Shared by every agent trigger. Base URL and service_role key come from
--    vault so no secret is committed; email_infra already stores the key as
--    'email_queue_service_role_key' and it is reused when no dedicated one exists.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.edge_functions_base_url()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT COALESCE(
    (SELECT decrypted_secret FROM vault.decrypted_secrets
      WHERE name = 'edge_functions_base_url' LIMIT 1),
    'https://vifganoknpydvjpzobro.supabase.co/functions/v1'
  );
$$;

CREATE OR REPLACE FUNCTION public.edge_functions_service_role_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT COALESCE(
    (SELECT decrypted_secret FROM vault.decrypted_secrets
      WHERE name = 'edge_functions_service_role_key' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets
      WHERE name = 'email_queue_service_role_key' LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION public.dispatch_edge_function(fn_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions, vault
AS $$
DECLARE
  service_key text;
  request_id bigint;
BEGIN
  service_key := public.edge_functions_service_role_key();
  IF service_key IS NULL THEN
    RAISE WARNING 'dispatch_edge_function(%): no service_role key in vault, skipping', fn_name;
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := public.edge_functions_base_url() || '/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := payload,
    timeout_milliseconds := 5000
  ) INTO request_id;

  RETURN request_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Trigger: every new permit is validated immediately
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_permits_intake_validator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_edge_function(
    'intake-validator',
    jsonb_build_object('permit_id', NEW.id, 'record', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_permits_intake_validator ON public.permits;
CREATE TRIGGER trg_permits_intake_validator
  AFTER INSERT ON public.permits
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_permits_intake_validator();
