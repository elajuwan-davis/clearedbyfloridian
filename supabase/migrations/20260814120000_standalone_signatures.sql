-- Real SignWell signatures for the three agreements that have no permit behind them:
-- the onboarding Permit Agent Authorization, the Payment Authorization, and the LPOA.
--
-- All three previously "signed" in the browser (a setTimeout, a canvas toDataURL, or in the
-- LPOA's case nothing at all). They now go through the same pipeline permit documents use —
-- signwell-send → signature_requests → HMAC-verified signwell-webhook — so a signature only
-- exists once SignWell says document_completed.
--
-- signature_requests is the single ledger: rather than duplicating the provider columns into
-- three tables, permit_id becomes nullable and a (context_kind, context_id) pair points at
-- the business record. The webhook therefore keeps matching one table.

-- ---------------------------------------------------------------------------
-- 1. Ledger: allow a signature that is not about a permit
-- ---------------------------------------------------------------------------

ALTER TABLE public.signature_requests
  ALTER COLUMN permit_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS context_kind text NOT NULL DEFAULT 'permit',
  ADD COLUMN IF NOT EXISTS context_id uuid,
  ADD COLUMN IF NOT EXISTS document_path text;

ALTER TABLE public.signature_requests
  DROP CONSTRAINT IF EXISTS signature_requests_context_kind_check;
ALTER TABLE public.signature_requests
  ADD CONSTRAINT signature_requests_context_kind_check
    CHECK (context_kind IN ('permit', 'paa', 'payment_authorization', 'lpoa'));

-- A permit row must still name its permit; a standalone one must name its context record.
ALTER TABLE public.signature_requests
  DROP CONSTRAINT IF EXISTS signature_requests_context_shape_check;
ALTER TABLE public.signature_requests
  ADD CONSTRAINT signature_requests_context_shape_check
    CHECK (
      (context_kind = 'permit' AND permit_id IS NOT NULL)
      OR (context_kind <> 'permit' AND context_id IS NOT NULL AND tenant_id IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS signature_requests_context_idx
  ON public.signature_requests (context_kind, context_id)
  WHERE context_id IS NOT NULL;

-- Tenant scoping now has two shapes: via the permit, or directly on the row for the
-- standalone agreements (which have no permit to inherit from).
DROP POLICY IF EXISTS "signature_requests_tenant_access" ON public.signature_requests;
CREATE POLICY "signature_requests_tenant_access" ON public.signature_requests
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (permit_id IS NOT NULL AND public.permit_in_current_tenant(permit_id))
    OR (permit_id IS NULL AND tenant_id = public.current_tenant_id())
  )
  WITH CHECK (
    public.is_admin()
    OR (permit_id IS NOT NULL AND public.permit_in_current_tenant(permit_id))
    OR (permit_id IS NULL AND tenant_id = public.current_tenant_id())
  );

-- ---------------------------------------------------------------------------
-- 2. Shared provider columns on the three agreement tables
-- ---------------------------------------------------------------------------

-- paa_signatures already exists (intake validator reads it). It gains the same provider
-- columns the ledger has, so "is the PAA signed?" is answerable without a join.
ALTER TABLE public.paa_signatures
  ADD COLUMN IF NOT EXISTS signature_request_id uuid REFERENCES public.signature_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signwell_document_id text,
  ADD COLUMN IF NOT EXISTS embedded_signing_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS status_source text NOT NULL DEFAULT 'staff_attested',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.paa_signatures
  DROP CONSTRAINT IF EXISTS paa_signatures_status_check;
ALTER TABLE public.paa_signatures
  ADD CONSTRAINT paa_signatures_status_check
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined'));
ALTER TABLE public.paa_signatures
  DROP CONSTRAINT IF EXISTS paa_signatures_status_source_check;
ALTER TABLE public.paa_signatures
  ADD CONSTRAINT paa_signatures_status_source_check
    CHECK (status_source IN ('provider_confirmed', 'staff_attested'));

CREATE TABLE IF NOT EXISTS public.payment_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_holder text NOT NULL,
  billing_address text NOT NULL,
  authorization_date date NOT NULL,
  terms_version text NOT NULL DEFAULT 'v1',
  signed_by uuid REFERENCES auth.users(id),
  signer_email text,
  signature_request_id uuid REFERENCES public.signature_requests(id) ON DELETE SET NULL,
  signwell_document_id text,
  embedded_signing_url text,
  document_path text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined')),
  status_source text NOT NULL DEFAULT 'staff_attested'
    CHECK (status_source IN ('provider_confirmed', 'staff_attested')),
  completed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_authorizations_tenant_idx
  ON public.payment_authorizations (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lpoa_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_revision text NOT NULL DEFAULT '2026.06',
  signer_name text NOT NULL,
  signer_title text NOT NULL,
  signer_email text,
  license_number text NOT NULL,
  signed_by uuid REFERENCES auth.users(id),
  signature_request_id uuid REFERENCES public.signature_requests(id) ON DELETE SET NULL,
  signwell_document_id text,
  embedded_signing_url text,
  document_path text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined')),
  status_source text NOT NULL DEFAULT 'staff_attested'
    CHECK (status_source IN ('provider_confirmed', 'staff_attested')),
  completed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lpoa_signatures_tenant_idx
  ON public.lpoa_signatures (tenant_id, created_at DESC);

-- Same posture as paa_signatures: read-only for clients, written through the RPCs below and
-- by the webhook. A browser cannot declare its own agreement signed.
GRANT SELECT ON public.payment_authorizations TO authenticated;
GRANT SELECT ON public.lpoa_signatures TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_authorizations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lpoa_signatures FROM authenticated;
GRANT ALL ON public.payment_authorizations TO service_role;
GRANT ALL ON public.lpoa_signatures TO service_role;
ALTER TABLE public.payment_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lpoa_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_authorizations_tenant_access" ON public.payment_authorizations;
CREATE POLICY "payment_authorizations_tenant_access" ON public.payment_authorizations
  FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "lpoa_signatures_tenant_access" ON public.lpoa_signatures;
CREATE POLICY "lpoa_signatures_tenant_access" ON public.lpoa_signatures
  FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

-- Provider truth is service-role only on these tables too.
CREATE OR REPLACE FUNCTION public.tg_agreement_guard_source()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: it must see the caller's role.
SET search_path = public
AS $$
DECLARE
  v_trusted boolean := current_user IN ('service_role', 'postgres', 'supabase_admin');
BEGIN
  IF NOT v_trusted THEN
    IF NEW.status_source = 'provider_confirmed' THEN
      RAISE EXCEPTION 'status_source=provider_confirmed may only be written by the SignWell webhook';
    END IF;
    IF NEW.signwell_document_id IS NOT NULL OR NEW.embedded_signing_url IS NOT NULL THEN
      RAISE EXCEPTION 'SignWell identifiers are written by the signwell-send function, not by clients';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paa_signatures_guard_source ON public.paa_signatures;
CREATE TRIGGER trg_paa_signatures_guard_source
  BEFORE INSERT OR UPDATE ON public.paa_signatures
  FOR EACH ROW EXECUTE FUNCTION public.tg_agreement_guard_source();

DROP TRIGGER IF EXISTS trg_payment_authorizations_guard_source ON public.payment_authorizations;
CREATE TRIGGER trg_payment_authorizations_guard_source
  BEFORE INSERT OR UPDATE ON public.payment_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.tg_agreement_guard_source();

DROP TRIGGER IF EXISTS trg_lpoa_signatures_guard_source ON public.lpoa_signatures;
CREATE TRIGGER trg_lpoa_signatures_guard_source
  BEFORE INSERT OR UPDATE ON public.lpoa_signatures
  FOR EACH ROW EXECUTE FUNCTION public.tg_agreement_guard_source();

-- ---------------------------------------------------------------------------
-- 3. Write paths — one draft row per agreement, stamped with the real signer
-- ---------------------------------------------------------------------------

-- record_paa_signature() predates SignWell: it minted a fake envelope id and the row it
-- created counted as a signature. It now creates the *draft* the send flow attaches to.
CREATE OR REPLACE FUNCTION public.record_paa_signature(
  p_version text,
  p_signer_name text,
  p_signer_email text,
  p_provider text DEFAULT 'SignWell'
)
RETURNS public.paa_signatures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_row public.paa_signatures;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  v_tenant := public.current_tenant_id();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'no tenant for current user';
  END IF;

  INSERT INTO public.paa_signatures (
    tenant_id, version, signer_name, signer_email, provider, signed_by, status
  ) VALUES (
    v_tenant,
    p_version,
    p_signer_name,
    p_signer_email,
    COALESCE(p_provider, 'SignWell'),
    auth.uid(),
    'draft'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_payment_authorization(
  p_account_holder text,
  p_billing_address text,
  p_authorization_date date,
  p_signer_email text DEFAULT NULL,
  p_terms_version text DEFAULT 'v1'
)
RETURNS public.payment_authorizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_row public.payment_authorizations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  v_tenant := public.current_tenant_id();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'no tenant for current user';
  END IF;

  INSERT INTO public.payment_authorizations (
    tenant_id, account_holder, billing_address, authorization_date,
    terms_version, signed_by, signer_email, status
  ) VALUES (
    v_tenant,
    p_account_holder,
    p_billing_address,
    p_authorization_date,
    COALESCE(p_terms_version, 'v1'),
    auth.uid(),
    p_signer_email,
    'draft'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_lpoa_signature(
  p_signer_name text,
  p_signer_title text,
  p_license_number text,
  p_signer_email text DEFAULT NULL,
  p_document_revision text DEFAULT '2026.06'
)
RETURNS public.lpoa_signatures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_row public.lpoa_signatures;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  v_tenant := public.current_tenant_id();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'no tenant for current user';
  END IF;

  INSERT INTO public.lpoa_signatures (
    tenant_id, signer_name, signer_title, license_number, signer_email,
    document_revision, signed_by, status
  ) VALUES (
    v_tenant,
    p_signer_name,
    p_signer_title,
    p_license_number,
    p_signer_email,
    COALESCE(p_document_revision, '2026.06'),
    auth.uid(),
    'draft'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Revoking is the one client-driven state change: it withdraws consent, it does not claim a
-- signature, so it stays available to the tenant that owns the authorization.
CREATE OR REPLACE FUNCTION public.revoke_payment_authorization(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  UPDATE public.payment_authorizations
     SET revoked_at = now()
   WHERE id = p_id
     AND revoked_at IS NULL
     AND (public.is_admin() OR tenant_id = public.current_tenant_id());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment authorization not found for this account';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_authorization(text, text, date, text, text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_payment_authorization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_lpoa_signature(text, text, text, text, text)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Storage for the generated agreement PDFs
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('signed-agreements', 'signed-agreements', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Path convention: {tenant_id}/{kind}/{context_id}.pdf. Uploads come from signwell-send
-- (service role, which bypasses RLS); members may read their own tenant's folder.
DROP POLICY IF EXISTS "signed_agreements_tenant_read" ON storage.objects;
CREATE POLICY "signed_agreements_tenant_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'signed-agreements'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = public.current_tenant_id()::text
    )
  );
