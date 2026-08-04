-- Agent 5 — Municipality Submission, pilot: City of Plantation (Accela Citizen Access).
--
-- Two-phase by design, because a real filing with a building department is not
-- undoable: `municipality-submit` drafts exactly what will be submitted and stops.
-- A staff member approves through public.approve_municipality_submission(), and only
-- that approval releases the job for execution — the same confirm-before-write shape
-- used for JobTread writes elsewhere.
--
-- Lovable Cloud has no Supabase dashboard for Database Webhooks, so the release is a
-- plain SQL trigger calling net.http_post() via dispatch_edge_function() (defined with
-- Agent 1 and re-declared here so the migrations apply in any order).

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 0. Dispatch helpers (idempotent copies of Agent 1's definitions)
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
-- 1. Pilot municipality configuration
--    One row = one municipality Cleard can file in. Portal metadata lives here
--    (not in code) so onboarding a second municipality is a row plus a driver,
--    and the pilot stays the only enabled row until it has been proven.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.municipality_submission_targets (
  slug text PRIMARY KEY,
  city_name text NOT NULL,
  county text,
  -- 'portal' drives the department's web portal; 'email' files by email intake.
  channel text NOT NULL CHECK (channel IN ('portal', 'email')),
  -- Which worker driver handles the portal ('accela_aca' today).
  driver text,
  portal_url text,
  intake_email text,
  intake_cc text[] NOT NULL DEFAULT ARRAY[]::text[],
  -- Nothing is submitted for a target that is not enabled.
  enabled boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.municipality_submission_targets TO authenticated;
GRANT ALL ON public.municipality_submission_targets TO service_role;
ALTER TABLE public.municipality_submission_targets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'municipality_submission_targets' AND policyname = 'mst_read'
  ) THEN
    CREATE POLICY "mst_read" ON public.municipality_submission_targets
      FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'municipality_submission_targets' AND policyname = 'mst_admin_write'
  ) THEN
    CREATE POLICY "mst_admin_write" ON public.municipality_submission_targets
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- The pilot. municipality_slug matches gc_portal_logins.municipality_slug so the
-- existing encrypted credential store is reused as-is.
INSERT INTO public.municipality_submission_targets
  (slug, city_name, county, channel, driver, portal_url, enabled, notes)
VALUES
  ('plantation', 'Plantation', 'Broward', 'portal', 'accela_aca',
   'https://aca.plantation.org/CitizenAccess/Default.aspx', true,
   'Agent 5 pilot. Accela Citizen Access; Cleard files here most often (firm address is in Plantation).')
ON CONFLICT (slug) DO UPDATE
  SET city_name = EXCLUDED.city_name,
      channel = EXCLUDED.channel,
      driver = EXCLUDED.driver,
      portal_url = EXCLUDED.portal_url,
      notes = EXCLUDED.notes,
      updated_at = now();

-- Second municipality onboarding shape, deliberately left disabled until the pilot
-- has been reported on.
INSERT INTO public.municipality_submission_targets
  (slug, city_name, county, channel, intake_email, enabled, notes)
VALUES
  ('sunrise', 'Sunrise', 'Broward', 'email', 'building@sunrisefl.gov', false,
   'Email-intake example. Disabled: do not file here until the Plantation pilot is reported.')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Submission ledger
--    status flow:
--      draft_pending_approval -> approved -> submitting -> submitted
--                             \-> rejected            \-> failed (retryable)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.municipality_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  municipality_slug text NOT NULL REFERENCES public.municipality_submission_targets(slug),
  channel text NOT NULL CHECK (channel IN ('portal', 'email')),
  status text NOT NULL DEFAULT 'draft_pending_approval'
    CHECK (status IN ('draft_pending_approval', 'approved', 'submitting',
                      'submitted', 'failed', 'rejected')),
  -- Exactly what will be sent: permit summary, document list with storage paths,
  -- resolved portal field values, and the target (portal URL or intake address).
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- The pre-submission-check verdict the draft was built from.
  pre_submission_report jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  approved_note text,
  rejected_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,
  submitted_at timestamptz,
  confirmation_number text,
  portal_receipt_path text,
  email_outbox_id uuid REFERENCES public.email_outbox(id) ON DELETE SET NULL,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  -- Set by a worker when it picks the job up, so two workers cannot both file.
  claimed_at timestamptz,
  claimed_by text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS municipality_submissions_permit_idx
  ON public.municipality_submissions (permit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS municipality_submissions_status_idx
  ON public.municipality_submissions (status);

-- One live submission per permit: a filed or in-flight permit cannot be filed twice.
CREATE UNIQUE INDEX IF NOT EXISTS municipality_submissions_one_live_idx
  ON public.municipality_submissions (permit_id)
  WHERE status IN ('draft_pending_approval', 'approved', 'submitting', 'submitted');

CREATE TABLE IF NOT EXISTS public.municipality_submission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.municipality_submissions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_label text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS municipality_submission_events_sub_idx
  ON public.municipality_submission_events (submission_id, created_at);

-- Staff/tenant can read their own submissions. Drafts are created only by the
-- municipality-submit edge function (service role), so a client cannot hand-build a draft
-- that skipped Agent 4's completeness check and then approve it. Every field that
-- represents "this was actually filed" is service-role only too (see the guard below).
GRANT SELECT ON public.municipality_submissions TO authenticated;
GRANT ALL ON public.municipality_submissions TO service_role;
GRANT SELECT ON public.municipality_submission_events TO authenticated;
GRANT ALL ON public.municipality_submission_events TO service_role;
ALTER TABLE public.municipality_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipality_submission_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'municipality_submissions' AND policyname = 'municipality_submissions_read'
  ) THEN
    CREATE POLICY "municipality_submissions_read" ON public.municipality_submissions
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.permit_in_current_tenant(permit_id));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'municipality_submission_events' AND policyname = 'mse_read'
  ) THEN
    CREATE POLICY "mse_read" ON public.municipality_submission_events
      FOR SELECT TO authenticated USING (
        public.is_admin() OR EXISTS (
          SELECT 1 FROM public.municipality_submissions s
          WHERE s.id = submission_id AND public.permit_in_current_tenant(s.permit_id)
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. The approval gate, in the database
--    A browser cannot move a row past draft_pending_approval, cannot approve, and
--    cannot invent a confirmation number. Approval happens only through the RPC
--    below, which records who approved it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_municipality_submissions_guard()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: it must see the caller's role. PostgREST switches
-- into the request role, so a browser is 'authenticated' and the edge function /
-- worker is 'service_role'.
SET search_path = public
AS $$
DECLARE
  v_trusted boolean := current_user IN ('service_role', 'postgres', 'supabase_admin');
BEGIN
  NEW.updated_at := now();

  IF v_trusted THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft_pending_approval' THEN
      RAISE EXCEPTION 'a submission must be created as draft_pending_approval';
    END IF;
    IF NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL
       OR NEW.confirmation_number IS NOT NULL OR NEW.submitted_at IS NOT NULL THEN
      RAISE EXCEPTION 'approval and filing fields are written by the approval RPC and the submitter, not by clients';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE from a browser: only rejecting a draft is allowed.
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (OLD.status = 'draft_pending_approval' AND NEW.status = 'rejected') THEN
    RAISE EXCEPTION 'status % -> % requires public.approve_municipality_submission() or the submitter',
      OLD.status, NEW.status;
  END IF;
  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.confirmation_number IS DISTINCT FROM OLD.confirmation_number
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     OR NEW.draft IS DISTINCT FROM OLD.draft THEN
    RAISE EXCEPTION 'approval, draft and filing fields are not client-writable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_municipality_submissions_guard ON public.municipality_submissions;
CREATE TRIGGER trg_municipality_submissions_guard
  BEFORE INSERT OR UPDATE ON public.municipality_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_municipality_submissions_guard();

-- Any authorized staff member satisfies the gate — it is not one specific person.
CREATE OR REPLACE FUNCTION public.approve_municipality_submission(
  _submission_id uuid,
  _note text DEFAULT NULL
)
RETURNS public.municipality_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.municipality_submissions;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only Cleard staff may approve a municipality submission';
  END IF;

  SELECT * INTO v_row FROM public.municipality_submissions
    WHERE id = _submission_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission % not found', _submission_id;
  END IF;
  IF v_row.status <> 'draft_pending_approval' THEN
    RAISE EXCEPTION 'submission % is %, only a draft_pending_approval row can be approved',
      _submission_id, v_row.status;
  END IF;

  UPDATE public.municipality_submissions
     SET status = 'approved',
         approved_by = auth.uid(),
         approved_at = now(),
         approved_note = _note
   WHERE id = _submission_id
   RETURNING * INTO v_row;

  INSERT INTO public.municipality_submission_events (submission_id, event_type, actor_label, detail)
  VALUES (_submission_id, 'approved', 'staff',
          jsonb_build_object('approved_by', v_row.approved_by, 'note', _note));

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_municipality_submission(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_municipality_submission(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_municipality_submission(
  _submission_id uuid,
  _reason text
)
RETURNS public.municipality_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.municipality_submissions;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only Cleard staff may reject a municipality submission';
  END IF;

  UPDATE public.municipality_submissions
     SET status = 'rejected',
         rejected_by = auth.uid(),
         rejected_at = now(),
         rejected_reason = _reason
   WHERE id = _submission_id AND status = 'draft_pending_approval'
   RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission % is not awaiting approval', _submission_id;
  END IF;

  INSERT INTO public.municipality_submission_events (submission_id, event_type, actor_label, detail)
  VALUES (_submission_id, 'rejected', 'staff', jsonb_build_object('reason', _reason));

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_municipality_submission(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_municipality_submission(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Release trigger: approval — and only approval — starts the filing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_municipality_submissions_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_edge_function(
    'municipality-submit',
    jsonb_build_object('action', 'execute', 'submission_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_municipality_submissions_release ON public.municipality_submissions;
CREATE TRIGGER trg_municipality_submissions_release
  AFTER UPDATE OF status ON public.municipality_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
  EXECUTE FUNCTION public.tg_municipality_submissions_release();

-- ---------------------------------------------------------------------------
-- 5. Worker claim: one worker, one job. The portal driver runs outside the
--    database (Playwright needs a browser), so it claims atomically.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_municipality_submission(
  _worker text,
  _slug text DEFAULT NULL
)
-- SETOF, not a bare composite: "no work" has to come back as zero rows, because a
-- composite return sends the worker a row of NULLs it could mistake for a job.
RETURNS SETOF public.municipality_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.municipality_submissions;
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'only the submission worker may claim jobs';
  END IF;

  SELECT s.* INTO v_row
    FROM public.municipality_submissions s
    JOIN public.municipality_submission_targets t ON t.slug = s.municipality_slug
   WHERE s.status = 'approved'
     AND s.approved_by IS NOT NULL
     AND s.channel = 'portal'
     AND t.enabled
     AND (_slug IS NULL OR s.municipality_slug = _slug)
   ORDER BY s.approved_at
   FOR UPDATE OF s SKIP LOCKED
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.municipality_submissions
     SET status = 'submitting',
         claimed_at = now(),
         claimed_by = _worker,
         attempts = attempts + 1
   WHERE id = v_row.id
   RETURNING * INTO v_row;

  INSERT INTO public.municipality_submission_events (submission_id, event_type, actor_label, detail)
  VALUES (v_row.id, 'claimed', _worker, jsonb_build_object('attempt', v_row.attempts));

  RETURN NEXT v_row;
END;
$$;

-- Worker-only: never granted to authenticated, so no browser can claim a filing job.
REVOKE ALL ON FUNCTION public.claim_municipality_submission(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_municipality_submission(text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Email channel: 'submitted' means the building department actually received it
--
-- The edge function only queues the email (with the application package as
-- permit-files attachments) and leaves the submission in 'submitting'. The outbox
-- dispatcher's own result promotes it: sent -> submitted, failed -> failed. Without this,
-- a queued-but-undeliverable email would read as a filed permit.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_email_outbox_submission_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.municipality_submissions;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_sub FROM public.municipality_submissions
   WHERE email_outbox_id = NEW.id AND channel = 'email'
   ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'sent' THEN
    UPDATE public.municipality_submissions
       SET status = 'submitted', submitted_at = COALESCE(NEW.sent_at, now()), last_error = NULL
     WHERE id = v_sub.id AND status <> 'submitted';

    INSERT INTO public.municipality_submission_events
      (submission_id, event_type, actor_label, detail)
    VALUES (v_sub.id, 'email_delivered', 'email dispatcher',
            jsonb_build_object('outbox_id', NEW.id, 'provider_message_id', NEW.provider_message_id));

    UPDATE public.permits SET status = 'submitted' WHERE id = v_sub.permit_id;

    INSERT INTO public.activity_events
      (tenant_id, permit_id, event_type, actor_label, summary, details)
    VALUES (v_sub.tenant_id, v_sub.permit_id, 'municipality_submitted', 'email dispatcher',
            format('Application emailed to %s', NEW.to_email),
            jsonb_build_object('submission_id', v_sub.id, 'outbox_id', NEW.id));

    INSERT INTO public.notifications (user_id, kind, title, body, permit_id)
    SELECT ur.user_id, 'municipality_submission',
           format('Application emailed to %s', NEW.to_email),
           'The building department received the application package by email.',
           v_sub.permit_id
      FROM public.user_roles ur WHERE ur.role = 'admin';

  ELSIF NEW.status = 'failed' THEN
    UPDATE public.municipality_submissions
       SET status = 'failed',
           last_error = COALESCE(NEW.error, 'email delivery failed'),
           claimed_at = NULL, claimed_by = NULL
     WHERE id = v_sub.id;

    INSERT INTO public.municipality_submission_events
      (submission_id, event_type, actor_label, detail)
    VALUES (v_sub.id, 'failed', 'email dispatcher',
            jsonb_build_object('outbox_id', NEW.id, 'reason', NEW.error));

    INSERT INTO public.notifications (user_id, kind, title, body, permit_id)
    SELECT ur.user_id, 'municipality_submission',
           'Emailed permit application could not be delivered',
           COALESCE(NEW.error, 'email delivery failed') ||
             ' — nothing was filed; the approval is still on record and can be retried.',
           v_sub.permit_id
      FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_email_outbox_submission_result ON public.email_outbox;
CREATE TRIGGER trg_email_outbox_submission_result
  AFTER UPDATE OF status ON public.email_outbox
  FOR EACH ROW EXECUTE FUNCTION public.tg_email_outbox_submission_result();
