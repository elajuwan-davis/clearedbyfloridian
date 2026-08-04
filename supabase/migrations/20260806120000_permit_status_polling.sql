-- Agent 6 — Status polling for filed permits (pilot: City of Plantation / Accela ACA).
--
-- Every 4 hours, pg_cron runs public.check_permit_status(), on the same pattern as the
-- COI / lien-notice / utility-locate jobs already live (plain SQL, no dashboard step).
--
-- Reading Accela needs a logged-in browser, and Postgres cannot drive one, so
-- check_permit_status() does the part SQL can do deterministically: it decides which
-- filed permits are due for a check and enqueues a poll for each. The Playwright worker
-- (scripts/portal-worker/permit-status-worker.ts, reusing Agent 5's login) claims a poll,
-- reads the record page, and hands the result back through
-- public.apply_permit_status_check(), which is where the comparison, the pipeline update,
-- the notification and the correction-notice insert happen — one transaction, no
-- "half-applied" status change.
--
-- Scoped to the Agent 5 pilot: only enabled portal targets are polled, so no municipality
-- is contacted that the pilot has not proven.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Last known portal state, on the submission that produced it
-- ---------------------------------------------------------------------------

ALTER TABLE public.municipality_submissions
  ADD COLUMN IF NOT EXISTS portal_status text,
  ADD COLUMN IF NOT EXISTS portal_status_raw text,
  ADD COLUMN IF NOT EXISTS portal_status_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_status_changed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Poll queue — one row per check attempt, so a missed or failing check is
--    visible instead of silent.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.permit_status_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.municipality_submissions(id) ON DELETE CASCADE,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  municipality_slug text NOT NULL REFERENCES public.municipality_submission_targets(slug),
  confirmation_number text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'checking', 'done', 'failed')),
  claimed_at timestamptz,
  claimed_by text,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  -- What the portal said, and what it mapped to.
  portal_status_raw text,
  portal_status text,
  previous_status text,
  status_changed boolean NOT NULL DEFAULT false,
  screenshot_path text,
  checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS permit_status_polls_open_idx
  ON public.permit_status_polls (status, created_at);
CREATE INDEX IF NOT EXISTS permit_status_polls_permit_idx
  ON public.permit_status_polls (permit_id, created_at DESC);

-- At most one open poll per submission: a slow or wedged check must not pile up
-- four more every four hours.
CREATE UNIQUE INDEX IF NOT EXISTS permit_status_polls_one_open_idx
  ON public.permit_status_polls (submission_id)
  WHERE status IN ('pending', 'checking');

-- ---------------------------------------------------------------------------
-- 3. Status history — the "what moved" source for the digest
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.permit_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.municipality_submissions(id) ON DELETE SET NULL,
  municipality_slug text,
  from_status text,
  to_status text NOT NULL,
  portal_status_raw text,
  source text NOT NULL DEFAULT 'portal_poll',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS permit_status_history_permit_idx
  ON public.permit_status_history (permit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS permit_status_history_recent_idx
  ON public.permit_status_history (created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Correction notices — Agent 7's trigger source.
--    Agent 6 only detects and stores them (portal poll or a staff upload); the
--    parsing/approval flow, and the pg_net trigger on this table, land with Agent 7.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.correction_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.municipality_submissions(id) ON DELETE SET NULL,
  municipality_slug text,
  source text NOT NULL DEFAULT 'portal_poll'
    CHECK (source IN ('portal_poll', 'staff_upload', 'email')),
  notice_label text,
  issued_at timestamptz,
  -- Storage path in the permit-files bucket (the downloaded notice), plus whatever
  -- review text the portal showed on the page.
  document_path text,
  raw_text text,
  detected_by text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'parsing', 'parsed', 'resolved', 'dismissed')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS correction_notices_permit_idx
  ON public.correction_notices (permit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS correction_notices_status_idx
  ON public.correction_notices (status);

-- The same notice must not be re-inserted on every 4-hour poll.
CREATE UNIQUE INDEX IF NOT EXISTS correction_notices_dedupe_idx
  ON public.correction_notices (permit_id, coalesce(document_path, notice_label, ''));

GRANT SELECT ON public.permit_status_polls TO authenticated;
GRANT ALL ON public.permit_status_polls TO service_role;
GRANT SELECT ON public.permit_status_history TO authenticated;
GRANT ALL ON public.permit_status_history TO service_role;
-- Staff may upload a notice that arrived by post or email (Agent 7's manual path);
-- nothing else about a notice is client-writable.
GRANT SELECT, INSERT ON public.correction_notices TO authenticated;
GRANT ALL ON public.correction_notices TO service_role;

ALTER TABLE public.permit_status_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_notices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'permit_status_polls' AND policyname = 'psp_read'
  ) THEN
    CREATE POLICY "psp_read" ON public.permit_status_polls
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.permit_in_current_tenant(permit_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'permit_status_history' AND policyname = 'psh_read'
  ) THEN
    CREATE POLICY "psh_read" ON public.permit_status_history
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.permit_in_current_tenant(permit_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'correction_notices' AND policyname = 'cn_read'
  ) THEN
    CREATE POLICY "cn_read" ON public.correction_notices
      FOR SELECT TO authenticated
      USING (public.is_admin() OR public.permit_in_current_tenant(permit_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'correction_notices' AND policyname = 'cn_staff_upload'
  ) THEN
    CREATE POLICY "cn_staff_upload" ON public.correction_notices
      FOR INSERT TO authenticated
      WITH CHECK (public.is_admin() AND source = 'staff_upload');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_permit_status_polls_touch ON public.permit_status_polls;
CREATE TRIGGER trg_permit_status_polls_touch
  BEFORE UPDATE ON public.permit_status_polls
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

DROP TRIGGER IF EXISTS trg_correction_notices_touch ON public.correction_notices;
CREATE TRIGGER trg_correction_notices_touch
  BEFORE UPDATE ON public.correction_notices
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Portal status text -> Cleard pipeline status.
--    Deterministic and deliberately incomplete: an unrecognised status is NOT
--    guessed at. It is stored raw and flagged to staff instead.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.map_portal_status(_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _raw IS NULL OR btrim(_raw) = '' THEN NULL
    WHEN _raw ~* '(void|withdraw|cancel|denied)'                 THEN 'cancelled'
    WHEN _raw ~* '(issued|permit issued|finaled)'                THEN 'permit_issued'
    WHEN _raw ~* '(correction|resubmit|revision required|insufficient|incomplete|rejected)'
                                                                 THEN 'corrections_required'
    WHEN _raw ~* '(ready to issue|approved|passed review)'        THEN 'approved'
    WHEN _raw ~* '(hold|suspend|pending payment|awaiting)'        THEN 'on_hold'
    -- Intake wording before review wording: "Application Accepted" is a filing that has
    -- landed, not one a reviewer has picked up.
    WHEN _raw ~* '(submitted|received|application accepted)'      THEN 'submitted'
    WHEN _raw ~* '(review|routed|accepted|in process|processing)' THEN 'in_review'
    ELSE NULL
  END;
$$;

-- ---------------------------------------------------------------------------
-- 6. check_permit_status() — the pg_cron entry point.
--    Enqueues a poll for every filed permit at an enabled portal target that has
--    not been checked within the interval, and returns how many it enqueued.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_permit_status(_stale interval DEFAULT interval '3 hours')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enqueued integer := 0;
BEGIN
  INSERT INTO public.permit_status_polls
    (submission_id, permit_id, municipality_slug, confirmation_number)
  SELECT s.id, s.permit_id, s.municipality_slug, s.confirmation_number
    FROM public.municipality_submissions s
    JOIN public.municipality_submission_targets t ON t.slug = s.municipality_slug
    JOIN public.permits p ON p.id = s.permit_id
   WHERE s.status = 'submitted'
     AND s.channel = 'portal'
     AND t.enabled
     -- Terminal pipeline states are not polled again.
     AND COALESCE(p.status, '') NOT IN ('permit_issued', 'cancelled')
     AND (s.portal_status_checked_at IS NULL OR s.portal_status_checked_at < now() - _stale)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_enqueued = ROW_COUNT;

  IF v_enqueued > 0 THEN
    INSERT INTO public.municipality_submission_events
      (submission_id, event_type, actor_label, detail)
    SELECT pl.submission_id, 'status_poll_enqueued', 'cron',
           jsonb_build_object('poll_id', pl.id)
      FROM public.permit_status_polls pl
     WHERE pl.status = 'pending' AND pl.created_at > now() - interval '1 minute';
  END IF;

  RETURN v_enqueued;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Worker claim — same shape as Agent 5's: service role only, SETOF so "no
--    work" is zero rows rather than a row of NULLs.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_permit_status_poll(
  _worker text,
  _slug text DEFAULT NULL
)
RETURNS SETOF public.permit_status_polls
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.permit_status_polls;
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'only the status worker may claim polls';
  END IF;

  SELECT pl.* INTO v_row
    FROM public.permit_status_polls pl
    JOIN public.municipality_submission_targets t ON t.slug = pl.municipality_slug
   WHERE pl.status = 'pending'
     AND t.enabled
     AND (_slug IS NULL OR pl.municipality_slug = _slug)
   ORDER BY pl.created_at
   FOR UPDATE OF pl SKIP LOCKED
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.permit_status_polls
     SET status = 'checking',
         claimed_at = now(),
         claimed_by = _worker,
         attempts = attempts + 1
   WHERE id = v_row.id
   RETURNING * INTO v_row;

  RETURN NEXT v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_permit_status_poll(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_permit_status_poll(text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 8. apply_permit_status_check() — everything that happens to a status result,
--    in one transaction: compare, update, notify, record a correction notice.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_permit_status_check(
  _poll_id uuid,
  _portal_status_raw text,
  _screenshot_path text DEFAULT NULL,
  _correction jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll public.permit_status_polls;
  v_sub public.municipality_submissions;
  v_permit_status text;
  v_mapped text;
  v_changed boolean := false;
  v_correction_id uuid;
  v_city text;
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'only the status worker may report a status check';
  END IF;

  SELECT * INTO v_poll FROM public.permit_status_polls WHERE id = _poll_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll % not found', _poll_id;
  END IF;

  SELECT * INTO v_sub FROM public.municipality_submissions
    WHERE id = v_poll.submission_id FOR UPDATE;

  SELECT status INTO v_permit_status FROM public.permits WHERE id = v_poll.permit_id;
  SELECT city_name INTO v_city FROM public.municipality_submission_targets
    WHERE slug = v_poll.municipality_slug;

  v_mapped := public.map_portal_status(_portal_status_raw);
  v_changed := COALESCE(v_sub.portal_status_raw, '') IS DISTINCT FROM COALESCE(_portal_status_raw, '');

  UPDATE public.permit_status_polls
     SET status = 'done',
         portal_status_raw = _portal_status_raw,
         portal_status = v_mapped,
         previous_status = v_sub.portal_status,
         status_changed = v_changed,
         screenshot_path = _screenshot_path,
         checked_at = now(),
         last_error = NULL
   WHERE id = _poll_id;

  UPDATE public.municipality_submissions
     SET portal_status = COALESCE(v_mapped, portal_status),
         portal_status_raw = _portal_status_raw,
         portal_status_checked_at = now(),
         portal_status_changed_at = CASE WHEN v_changed THEN now() ELSE portal_status_changed_at END
   WHERE id = v_sub.id;

  -- No change: nothing else to do. The check itself is recorded above.
  IF NOT v_changed THEN
    RETURN jsonb_build_object('changed', false, 'portal_status', v_mapped);
  END IF;

  INSERT INTO public.municipality_submission_events
    (submission_id, event_type, actor_label, detail)
  VALUES (v_sub.id, 'portal_status_changed', v_poll.claimed_by,
          jsonb_build_object('raw', _portal_status_raw, 'mapped', v_mapped,
                             'previous', v_sub.portal_status_raw));

  -- An unmapped status is never written onto the permit; staff read it instead.
  IF v_mapped IS NOT NULL AND v_mapped IS DISTINCT FROM v_permit_status THEN
    INSERT INTO public.permit_status_history
      (permit_id, submission_id, municipality_slug, from_status, to_status,
       portal_status_raw, source, detail)
    VALUES (v_poll.permit_id, v_sub.id, v_poll.municipality_slug, v_permit_status, v_mapped,
            _portal_status_raw, 'portal_poll', jsonb_build_object('poll_id', _poll_id));

    UPDATE public.permits SET status = v_mapped WHERE id = v_poll.permit_id;

    INSERT INTO public.activity_events
      (tenant_id, permit_id, event_type, actor_label, summary, details)
    VALUES (v_sub.tenant_id, v_poll.permit_id, 'permit_status_changed', 'status poller',
            format('%s moved to %s at %s', COALESCE(v_sub.confirmation_number, 'permit'),
                   v_mapped, COALESCE(v_city, v_poll.municipality_slug)),
            jsonb_build_object('from', v_permit_status, 'to', v_mapped,
                               'portal_status', _portal_status_raw));
  END IF;

  INSERT INTO public.notifications (user_id, kind, title, body, permit_id)
  SELECT ur.user_id, 'permit_status_change',
         format('%s — %s', COALESCE(v_city, v_poll.municipality_slug),
                COALESCE(_portal_status_raw, 'status unavailable')),
         CASE
           WHEN v_mapped IS NULL THEN
             format('The portal now reads "%s", which Cleard does not map to a pipeline status yet — review it manually.',
                    _portal_status_raw)
           ELSE format('Permit moved from %s to %s (portal: "%s").',
                       COALESCE(v_permit_status, 'unknown'), v_mapped, _portal_status_raw)
         END,
         v_poll.permit_id
    FROM public.user_roles ur
   WHERE ur.role = 'admin';

  -- A correction notice is Agent 7's trigger. It is inserted only when the poller
  -- actually found one; the unique index makes a repeat poll a no-op.
  IF _correction IS NOT NULL AND _correction <> 'null'::jsonb THEN
    INSERT INTO public.correction_notices
      (tenant_id, permit_id, submission_id, municipality_slug, source, notice_label,
       issued_at, document_path, raw_text, detected_by)
    VALUES (v_sub.tenant_id, v_poll.permit_id, v_sub.id, v_poll.municipality_slug,
            'portal_poll', _correction->>'label',
            COALESCE((_correction->>'issued_at')::timestamptz, now()),
            _correction->>'document_path', _correction->>'raw_text', v_poll.claimed_by)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_correction_id;

    IF v_correction_id IS NOT NULL THEN
      INSERT INTO public.municipality_submission_events
        (submission_id, event_type, actor_label, detail)
      VALUES (v_sub.id, 'correction_notice_detected', v_poll.claimed_by,
              jsonb_build_object('correction_notice_id', v_correction_id,
                                 'document_path', _correction->>'document_path'));
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'changed', true,
    'portal_status', v_mapped,
    'permit_status', COALESCE(v_mapped, v_permit_status),
    'correction_notice_id', v_correction_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_permit_status_check(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_permit_status_check(uuid, text, text, jsonb) TO service_role;

-- A check that could not be completed is recorded as failed rather than left 'checking'.
CREATE OR REPLACE FUNCTION public.fail_permit_status_check(_poll_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'only the status worker may fail a poll';
  END IF;

  UPDATE public.permit_status_polls
     SET status = 'failed', last_error = _reason, checked_at = now(),
         claimed_at = NULL, claimed_by = NULL
   WHERE id = _poll_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fail_permit_status_check(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_permit_status_check(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 9. Daily digest: what moved, what is stuck.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.permit_status_digest(_since interval DEFAULT interval '1 day')
RETURNS TABLE (
  bucket text,
  permit_id uuid,
  municipality_slug text,
  confirmation_number text,
  detail text,
  as_of timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Moved: a pipeline status change recorded by the poller in the window.
  SELECT 'moved'::text, h.permit_id, h.municipality_slug, s.confirmation_number,
         format('%s -> %s (portal: %s)', COALESCE(h.from_status, 'unknown'), h.to_status,
                COALESCE(h.portal_status_raw, 'n/a')),
         h.created_at
    FROM public.permit_status_history h
    LEFT JOIN public.municipality_submissions s ON s.id = h.submission_id
   WHERE h.created_at > now() - _since

  UNION ALL

  -- Stuck: filed, but the portal has said the same thing for over a week.
  SELECT 'stuck'::text, s.permit_id, s.municipality_slug, s.confirmation_number,
         format('no portal change since %s (portal: %s)',
                COALESCE(s.portal_status_changed_at, s.submitted_at)::date,
                COALESCE(s.portal_status_raw, 'never read')),
         COALESCE(s.portal_status_changed_at, s.submitted_at)
    FROM public.municipality_submissions s
    JOIN public.permits p ON p.id = s.permit_id
   WHERE s.status = 'submitted'
     AND COALESCE(p.status, '') NOT IN ('permit_issued', 'cancelled')
     AND COALESCE(s.portal_status_changed_at, s.submitted_at) < now() - interval '7 days'

  UNION ALL

  -- Unread: the poller itself is failing, which otherwise looks like "no news".
  SELECT 'check_failing'::text, pl.permit_id, pl.municipality_slug, pl.confirmation_number,
         COALESCE(pl.last_error, 'status check failed'), pl.checked_at
    FROM public.permit_status_polls pl
   WHERE pl.status = 'failed'
     AND pl.checked_at > now() - _since

  ORDER BY 1, 6 DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.permit_status_digest(interval) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.send_permit_status_digest()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_moved integer;
  v_stuck integer;
  v_failing integer;
  v_body text;
  v_rows integer := 0;
BEGIN
  SELECT count(*) FILTER (WHERE bucket = 'moved'),
         count(*) FILTER (WHERE bucket = 'stuck'),
         count(*) FILTER (WHERE bucket = 'check_failing')
    INTO v_moved, v_stuck, v_failing
    FROM public.permit_status_digest(interval '1 day');

  IF COALESCE(v_moved, 0) + COALESCE(v_stuck, 0) + COALESCE(v_failing, 0) = 0 THEN
    RETURN 0;
  END IF;

  SELECT string_agg(format('%s: %s', bucket, detail), E'\n' ORDER BY bucket)
    INTO v_body
    FROM public.permit_status_digest(interval '1 day');

  INSERT INTO public.notifications (user_id, kind, title, body)
  SELECT ur.user_id, 'permit_status_digest',
         format('Permit status digest — %s moved, %s stuck', v_moved, v_stuck),
         v_body
    FROM public.user_roles ur
   WHERE ur.role = 'admin';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. The schedules (pg_cron), idempotent like the existing expiry jobs.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-permit-status') THEN
    PERFORM cron.unschedule('check-permit-status');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'permit-status-daily-digest') THEN
    PERFORM cron.unschedule('permit-status-daily-digest');
  END IF;
END $$;

SELECT cron.schedule(
  'check-permit-status',
  '0 */4 * * *',
  'SELECT public.check_permit_status()'
);

SELECT cron.schedule(
  'permit-status-daily-digest',
  '0 12 * * *',
  'SELECT public.send_permit_status_digest()'
);
