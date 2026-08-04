-- Agent 3 — Scope Draft.
--
-- Turns the GC's free-text project description into formal Florida permit
-- application scope language. Runs in parallel with Agent 2's document
-- generation: same green-transition condition, separate trigger, neither waits
-- on the other.
--
-- Plain SQL trigger + net.http_post() (no Supabase dashboard on Lovable Cloud),
-- reusing public.dispatch_edge_function() from 20260805120000_intake_validator.sql.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

ALTER TABLE public.permits
  ADD COLUMN IF NOT EXISTS scope_concise text,
  ADD COLUMN IF NOT EXISTS scope_detailed text,
  ADD COLUMN IF NOT EXISTS scope_drafted_at timestamptz,
  ADD COLUMN IF NOT EXISTS scope_draft_meta jsonb;

CREATE OR REPLACE FUNCTION public.tg_permits_scope_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_edge_function(
    'scope-draft',
    jsonb_build_object('permit_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_permits_scope_draft ON public.permits;
CREATE TRIGGER trg_permits_scope_draft
  AFTER UPDATE OF validation_status ON public.permits
  FOR EACH ROW
  WHEN (NEW.validation_status = 'green' AND OLD.validation_status IS DISTINCT FROM 'green')
  EXECUTE FUNCTION public.tg_permits_scope_draft();
