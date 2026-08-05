-- A rehearsal submission — draft.test_only = true — must be able to travel the whole
-- approval path (draft → approve_municipality_submission() → release trigger) without any
-- chance of a real filing with a building department.
--
-- The edge function stops such a row before the portal queue and before email_outbox, but
-- the portal worker reads the database directly, so the claim itself has to refuse it too:
-- that is the layer that owns the browser.

CREATE OR REPLACE FUNCTION public.claim_municipality_submission(
  _worker text,
  _slug text DEFAULT NULL
)
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
     -- Rehearsal rows are never claimable: no browser, no portal, no filing.
     AND COALESCE((s.draft->>'test_only')::boolean, false) = false
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

REVOKE ALL ON FUNCTION public.claim_municipality_submission(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_municipality_submission(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_municipality_submission(text, text) TO service_role;

-- A rehearsal row must not be able to acquire a confirmation number or a submitted state by
-- any path, including a future code change that forgets the check above.
CREATE OR REPLACE FUNCTION public.tg_municipality_submissions_no_test_filing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE((NEW.draft->>'test_only')::boolean, false)
     AND (NEW.status IN ('submitting', 'submitted')
          OR NEW.confirmation_number IS NOT NULL
          OR NEW.submitted_at IS NOT NULL) THEN
    RAISE EXCEPTION
      'submission % is marked draft.test_only — it cannot be filed or given a confirmation number',
      NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_municipality_submissions_no_test_filing
  ON public.municipality_submissions;
CREATE TRIGGER trg_municipality_submissions_no_test_filing
BEFORE INSERT OR UPDATE ON public.municipality_submissions
FOR EACH ROW
EXECUTE FUNCTION public.tg_municipality_submissions_no_test_filing();
