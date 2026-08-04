-- Real SignWell integration.
--
-- Agent 4 shipped signature_requests with status_source in ('provider','manual') because
-- SignWell was a localStorage stub — nothing could ever legitimately be 'provider'. The
-- provider is now wired for real, so the two states get their operational names and the
-- completeness gate requires the provider one:
--
--   'staff_attested'     — a staff member says the signature exists. NOT sufficient.
--   'provider_confirmed' — SignWell posted document_completed for it. Sufficient.
--
-- Writing 'provider_confirmed' stays service-role only (the webhook), so a browser cannot
-- claim SignWell confirmed anything.

-- ---------------------------------------------------------------------------
-- 1. Provider columns on the ledger
-- ---------------------------------------------------------------------------

ALTER TABLE public.signature_requests
  ADD COLUMN IF NOT EXISTS signwell_document_id text,
  ADD COLUMN IF NOT EXISTS signwell_recipient_id text,
  ADD COLUMN IF NOT EXISTS embedded_signing_url text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS test_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_event_type text,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz;

-- One ledger row per SignWell recipient on a document.
CREATE UNIQUE INDEX IF NOT EXISTS signature_requests_signwell_recipient_key
  ON public.signature_requests (signwell_document_id, signwell_recipient_id)
  WHERE signwell_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS signature_requests_signwell_document_idx
  ON public.signature_requests (signwell_document_id)
  WHERE signwell_document_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Rename the provenance values
-- ---------------------------------------------------------------------------

ALTER TABLE public.signature_requests
  DROP CONSTRAINT IF EXISTS signature_requests_status_source_check;

UPDATE public.signature_requests
   SET status_source = CASE status_source
                         WHEN 'provider' THEN 'provider_confirmed'
                         WHEN 'manual' THEN 'staff_attested'
                         ELSE status_source
                       END
 WHERE status_source IN ('provider', 'manual');

ALTER TABLE public.signature_requests
  ALTER COLUMN status_source SET DEFAULT 'staff_attested',
  ADD CONSTRAINT signature_requests_status_source_check
    CHECK (status_source IN ('provider_confirmed', 'staff_attested'));

-- Same guard, new value name: only the service role (the webhook) may assert that the
-- provider confirmed a signature.
CREATE OR REPLACE FUNCTION public.tg_signature_requests_guard_source()
RETURNS trigger
LANGUAGE plpgsql
-- Deliberately SECURITY INVOKER: it must see the *caller's* role, which a
-- SECURITY DEFINER function would replace with the function owner.
SET search_path = public
AS $$
DECLARE
  -- PostgREST switches into the request's role, so a browser is 'authenticated'/'anon' and
  -- the webhook is 'service_role'. Superusers are listed because they can drop this trigger
  -- anyway; excluding them would only break psql/migration maintenance.
  v_trusted boolean := current_user IN ('service_role', 'postgres', 'supabase_admin');
BEGIN
  IF NEW.status_source = 'provider_confirmed' AND NOT v_trusted THEN
    RAISE EXCEPTION 'status_source=provider_confirmed may only be written by the SignWell webhook';
  END IF;
  -- A browser cannot hand-write provider identifiers either.
  IF NOT v_trusted THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.signwell_document_id IS NOT NULL
         OR NEW.signwell_recipient_id IS NOT NULL
         OR NEW.embedded_signing_url IS NOT NULL
         OR NEW.completed_at IS NOT NULL THEN
        RAISE EXCEPTION 'SignWell identifiers are written by the signwell-send function, not by clients';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.signwell_document_id IS DISTINCT FROM OLD.signwell_document_id
         OR NEW.signwell_recipient_id IS DISTINCT FROM OLD.signwell_recipient_id
         OR NEW.embedded_signing_url IS DISTINCT FROM OLD.embedded_signing_url
         OR NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
        RAISE EXCEPTION 'SignWell identifiers are written by the signwell-send function, not by clients';
      END IF;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Registered webhook — its id is the HMAC key for event verification
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.signwell_webhooks (
  id text PRIMARY KEY,                 -- SignWell's webhook id; the HMAC-SHA256 key
  callback_url text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz,
  last_event_type text,
  active boolean NOT NULL DEFAULT true
);

-- The id is a verification secret: service role only, no authenticated grant, RLS on with
-- no policy so PostgREST returns nothing even if a grant is added by accident later.
REVOKE ALL ON public.signwell_webhooks FROM authenticated, anon;
GRANT ALL ON public.signwell_webhooks TO service_role;
ALTER TABLE public.signwell_webhooks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. Delivered-event log — makes replays visible and keeps the webhook idempotent
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.signwell_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_time bigint,
  event_hash text NOT NULL,
  signwell_document_id text,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS signwell_events_hash_key
  ON public.signwell_events (event_hash);

REVOKE ALL ON public.signwell_events FROM authenticated, anon;
GRANT ALL ON public.signwell_events TO service_role;
ALTER TABLE public.signwell_events ENABLE ROW LEVEL SECURITY;
