-- Agent 4 — Pre-Submission Completeness.
--
-- No trigger here: pre-submission-check is invoked directly by the "Route for
-- Signatures" staff action and re-run by the submit gate, so the only schema this
-- needs is somewhere to record the verdict plus the signature ledger the check
-- reads.
--
-- Investigation note (see PR): SignWell is NOT configured. src/lib/signature-requests.ts
-- is localStorage-only with a `// TODO: replace with Signwell API call` where the
-- provider call belongs, and no SignWell key exists anywhere in the project. The only
-- signwell_id columns in the schema (lien_releases, lien_notices) are never written by
-- an API response. So there was no server-side signature state for a deterministic
-- check to query — signature_requests below is that state, and every row carries how
-- its status was obtained so an unconfigured provider can never look like a
-- provider-confirmed signature.

-- ---------------------------------------------------------------------------
-- 1. Verdict columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS pre_submission_status text
    CHECK (pre_submission_status IN ('pass', 'blocked')),
  ADD COLUMN IF NOT EXISTS pre_submission_report jsonb,
  ADD COLUMN IF NOT EXISTS pre_submission_checked_at timestamptz;

-- Agent 2 writes these; declared here too so Agent 4 applies in either order.
ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS document_bundle_path text,
  ADD COLUMN IF NOT EXISTS document_bundle_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS document_bundle_report jsonb;

-- ---------------------------------------------------------------------------
-- 2. Signature ledger
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  document_key text,
  document_name text NOT NULL,
  recipient_email text NOT NULL,
  recipient_role text NOT NULL DEFAULT 'Other'
    CHECK (recipient_role IN ('Homeowner', 'General Contractor', 'Subcontractor', 'Other')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined')),
  -- 'provider' = written from a SignWell webhook/API response; 'manual' = a staff
  -- member attested to a signature obtained outside the product. The check reports
  -- these differently instead of treating them as equivalent evidence.
  status_source text NOT NULL DEFAULT 'manual'
    CHECK (status_source IN ('provider', 'manual')),
  provider text NOT NULL DEFAULT 'SignWell',
  provider_envelope_id text,
  sent_at timestamptz,
  signed_at timestamptz,
  signed_by_name text,
  declined_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signature_requests_permit_idx
  ON public.signature_requests (permit_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.signature_requests TO authenticated;
GRANT ALL ON public.signature_requests TO service_role;
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'signature_requests'
      AND policyname = 'signature_requests_tenant_access'
  ) THEN
    CREATE POLICY "signature_requests_tenant_access" ON public.signature_requests
      FOR ALL TO authenticated
      USING (public.is_admin() OR public.permit_in_current_tenant(permit_id))
      WITH CHECK (public.is_admin() OR public.permit_in_current_tenant(permit_id));
  END IF;
END $$;

-- 'provider' rows are provider truth and must come from the webhook/service role, not
-- from a browser claiming SignWell said so.
CREATE OR REPLACE FUNCTION public.tg_signature_requests_guard_source()
RETURNS trigger
LANGUAGE plpgsql
-- Deliberately SECURITY INVOKER: it must see the *caller's* role, which a
-- SECURITY DEFINER function would replace with the function owner.
SET search_path = public
AS $$
BEGIN
  -- PostgREST switches into the request's role, so current_user is 'service_role' for
  -- service-key callers (the webhook) and 'authenticated' for a browser.
  IF NEW.status_source = 'provider' AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'status_source=provider may only be written by the provider webhook';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_signature_requests_guard_source ON public.signature_requests;
CREATE TRIGGER trg_signature_requests_guard_source
  BEFORE INSERT OR UPDATE ON public.signature_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_signature_requests_guard_source();
