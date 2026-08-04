-- Agent 7 — Corrections parser, with the staff approval gate in the database.
--
-- Agent 6 inserts a correction_notices row whenever the portal shows a correction letter;
-- staff can also upload one. Either way the INSERT fires a plain-SQL pg_net trigger (Lovable
-- Cloud has no dashboard to register a Database Webhook in) that invokes corrections-parser.
--
-- The gate: the parser only ever writes a correction_plans row in 'draft_pending_approval'.
-- Nothing reaches the GC or the building department until a staff member calls
-- approve_correction_plan(), and it is that approval — not the parser, and not the browser —
-- that releases the send, through a second trigger. The same confirm-before-write shape as
-- Agent 5 and the JobTread writes.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 1. The reviewable plan
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.correction_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  notice_id uuid NOT NULL REFERENCES public.correction_notices(id) ON DELETE CASCADE,
  municipality_slug text,

  status text NOT NULL DEFAULT 'draft_pending_approval'
    CHECK (status IN (
      'draft_pending_approval',  -- parsed, waiting on a staff member
      'approved',                -- staff approved; the send is released
      'sending',                 -- the acknowledgment is queued with the mailer
      'sent',                    -- acknowledgment left Cleard
      'rejected',                -- staff said no; nothing is ever sent
      'failed'                   -- the send could not be queued
    )),

  -- What the model produced, already validated against closed sets by
  -- _shared/correction-parse.ts. Kept whole so staff review exactly what was drafted.
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Deterministic rollups computed in code, not asked of the model.
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  item_count integer NOT NULL DEFAULT 0,
  overall_complexity text,
  -- The letter, as parsed, plus the model that drafted it and how the item count compares
  -- with the numbered comments actually found in the letter.
  letter_excerpt text,
  model text,
  numbered_comments_found integer,

  -- Where the acknowledgment would go. Recorded at draft time so staff approve a concrete
  -- recipient rather than "whatever the code resolves later".
  ack_to_email text,
  ack_cc_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
  ack_subject text,
  ack_body text,

  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  approved_note text,
  rejected_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejected_reason text,
  sent_at timestamptz,
  outbox_id uuid,
  last_error text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One live plan per notice: re-parsing a notice must not stack up two drafts a staff member
-- could approve twice.
CREATE UNIQUE INDEX IF NOT EXISTS correction_plans_live_idx
  ON public.correction_plans (notice_id)
  WHERE status IN ('draft_pending_approval', 'approved', 'sending');

CREATE INDEX IF NOT EXISTS correction_plans_permit_idx
  ON public.correction_plans (permit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS correction_plans_status_idx
  ON public.correction_plans (status);

CREATE TABLE IF NOT EXISTS public.correction_plan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.correction_plans(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_label text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS correction_plan_events_plan_idx
  ON public.correction_plan_events (plan_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_correction_plans_touch ON public.correction_plans;
CREATE TRIGGER trg_correction_plans_touch
  BEFORE UPDATE ON public.correction_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2. RLS. Read only; every write goes through the RPCs below or the parser's
--    service role, so a browser cannot approve, edit or send anything.
-- ---------------------------------------------------------------------------

ALTER TABLE public.correction_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_plan_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.correction_plans TO authenticated;
GRANT SELECT ON public.correction_plan_events TO authenticated;
GRANT ALL ON public.correction_plans TO service_role;
GRANT ALL ON public.correction_plan_events TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'correction_plans' AND policyname = 'cp_read'
  ) THEN
    -- A draft is staff-only on purpose: "nothing reaches the GC before approval" includes
    -- the GC reading the draft letter off their own permit. Tenant users see a plan once a
    -- staff member has approved it, which is also when it is sent.
    CREATE POLICY "cp_read" ON public.correction_plans
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR (
          public.permit_in_current_tenant(permit_id)
          AND status IN ('approved', 'sending', 'sent')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename = 'correction_plan_events' AND policyname = 'cpe_read'
  ) THEN
    CREATE POLICY "cpe_read" ON public.correction_plan_events
      FOR SELECT TO authenticated
      USING (
        public.is_admin()
        OR EXISTS (
          SELECT 1 FROM public.correction_plans p
           WHERE p.id = plan_id
             AND public.permit_in_current_tenant(p.permit_id)
             AND p.status IN ('approved', 'sending', 'sent')
        )
      );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. The parse trigger: every new correction notice is parsed immediately
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tg_correction_notices_parse()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_edge_function(
    'corrections-parser',
    jsonb_build_object('action', 'parse', 'notice_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_correction_notices_parse ON public.correction_notices;
CREATE TRIGGER trg_correction_notices_parse
  AFTER INSERT ON public.correction_notices
  FOR EACH ROW
  WHEN (NEW.status = 'new')
  EXECUTE FUNCTION public.tg_correction_notices_parse();

-- ---------------------------------------------------------------------------
-- 4. The approval gate
-- ---------------------------------------------------------------------------

-- Belt and braces: even with the RLS above, a plan row may never be created outside
-- 'draft_pending_approval', and the approval/send columns are not client-writable.
CREATE OR REPLACE FUNCTION public.tg_correction_plans_guard()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY INVOKER on purpose: a definer trigger would see its own owner in current_user
-- and wave every browser write through. PostgREST switches into the request role, so a
-- browser session is 'authenticated' and the parser / RPCs are service_role or the owner.
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    -- BEFORE DELETE has no NEW; returning NULL there would silently cancel the delete.
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'correction plans are written by corrections-parser, not by clients';
  END IF;

  RAISE EXCEPTION 'use approve_correction_plan() or reject_correction_plan() to change a plan';
END;
$$;

DROP TRIGGER IF EXISTS trg_correction_plans_guard ON public.correction_plans;
CREATE TRIGGER trg_correction_plans_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.correction_plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_correction_plans_guard();

CREATE OR REPLACE FUNCTION public.approve_correction_plan(
  _plan_id uuid,
  _note text DEFAULT NULL
)
RETURNS public.correction_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.correction_plans;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only Cleard staff may approve a correction response';
  END IF;

  SELECT * INTO v_row FROM public.correction_plans
    WHERE id = _plan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'correction plan % not found', _plan_id;
  END IF;
  IF v_row.status <> 'draft_pending_approval' THEN
    RAISE EXCEPTION 'correction plan % is %, only a draft_pending_approval plan can be approved',
      _plan_id, v_row.status;
  END IF;
  IF COALESCE(btrim(v_row.ack_to_email), '') = '' THEN
    RAISE EXCEPTION 'correction plan % has no acknowledgment recipient — nothing to approve',
      _plan_id;
  END IF;

  UPDATE public.correction_plans
     SET status = 'approved',
         approved_by = auth.uid(),
         approved_at = now(),
         approved_note = _note
   WHERE id = _plan_id
   RETURNING * INTO v_row;

  INSERT INTO public.correction_plan_events (plan_id, event_type, actor_label, detail)
  VALUES (_plan_id, 'approved', 'staff',
          jsonb_build_object('approved_by', v_row.approved_by, 'note', _note));

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_correction_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_correction_plan(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_correction_plan(
  _plan_id uuid,
  _reason text
)
RETURNS public.correction_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.correction_plans;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only Cleard staff may reject a correction response';
  END IF;
  IF COALESCE(btrim(_reason), '') = '' THEN
    RAISE EXCEPTION 'a rejection needs a reason so the redraft has something to work from';
  END IF;

  SELECT * INTO v_row FROM public.correction_plans
    WHERE id = _plan_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'correction plan % not found', _plan_id;
  END IF;
  IF v_row.status <> 'draft_pending_approval' THEN
    RAISE EXCEPTION 'correction plan % is %, only a draft_pending_approval plan can be rejected',
      _plan_id, v_row.status;
  END IF;

  UPDATE public.correction_plans
     SET status = 'rejected',
         rejected_by = auth.uid(),
         rejected_at = now(),
         rejected_reason = _reason
   WHERE id = _plan_id
   RETURNING * INTO v_row;

  INSERT INTO public.correction_plan_events (plan_id, event_type, actor_label, detail)
  VALUES (_plan_id, 'rejected', 'staff',
          jsonb_build_object('rejected_by', v_row.rejected_by, 'reason', _reason));

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_correction_plan(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_correction_plan(uuid, text) TO authenticated;

-- The release: approval, and only approval, invokes the send path. The parser cannot reach
-- this — it never sets status = 'approved'.
CREATE OR REPLACE FUNCTION public.tg_correction_plans_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_edge_function(
    'corrections-parser',
    jsonb_build_object('action', 'send', 'plan_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_correction_plans_release ON public.correction_plans;
CREATE TRIGGER trg_correction_plans_release
  AFTER UPDATE OF status ON public.correction_plans
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
  EXECUTE FUNCTION public.tg_correction_plans_release();

-- ---------------------------------------------------------------------------
-- 5. What staff see: open correction work, newest first
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.correction_review_queue()
RETURNS TABLE (
  plan_id uuid,
  permit_id uuid,
  notice_id uuid,
  project_label text,
  municipality_slug text,
  status text,
  item_count integer,
  overall_complexity text,
  waiting_hours numeric,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.id,
         cp.permit_id,
         cp.notice_id,
         COALESCE(p.project_name, p.job_address),
         cp.municipality_slug,
         cp.status,
         cp.item_count,
         cp.overall_complexity,
         round(extract(epoch FROM now() - cp.created_at) / 3600.0, 1),
         cp.created_at
    FROM public.correction_plans cp
    JOIN public.permits p ON p.id = cp.permit_id
   WHERE cp.status IN ('draft_pending_approval', 'approved', 'sending', 'failed')
     -- SECURITY DEFINER: current_user is the owner in here, so the caller is read off the
     -- request claims instead. The queue is a staff review queue, so unlike the read policy
     -- it is admin/internal only — a tenant user has no business in it at all.
     AND (
       COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role', 'internal')
         IN ('internal', 'service_role')
       OR public.is_admin()
     )
   ORDER BY cp.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.correction_review_queue() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.correction_review_queue() TO authenticated, service_role;
