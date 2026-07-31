-- 1. feature_requests: move internal_note to admin-only table
CREATE TABLE public.feature_request_notes (
  request_id uuid PRIMARY KEY REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  internal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_request_notes TO authenticated;
GRANT ALL ON public.feature_request_notes TO service_role;

ALTER TABLE public.feature_request_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frn admin all" ON public.feature_request_notes
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER frn_touch_updated_at BEFORE UPDATE ON public.feature_request_notes
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

INSERT INTO public.feature_request_notes (request_id, internal_note)
SELECT id, internal_note FROM public.feature_requests WHERE internal_note IS NOT NULL;

ALTER TABLE public.feature_requests DROP COLUMN internal_note;

-- Scope reads: own tenant / own submissions, admins see all
DROP POLICY IF EXISTS "fr auth read all" ON public.feature_requests;
CREATE POLICY "fr read scoped" ON public.feature_requests
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id())
  );

-- 2. permit_updates: clients may only touch acknowledged_at
REVOKE UPDATE ON public.permit_updates FROM authenticated;
GRANT UPDATE (acknowledged_at) ON public.permit_updates TO authenticated;

-- 3. tenant_invites: owners (or admins) only
DROP POLICY IF EXISTS "Tenant owners can manage invites" ON public.tenant_invites;
CREATE POLICY "Tenant owners can manage invites" ON public.tenant_invites
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'gc_owner'::public.app_role))
  )
  WITH CHECK (
    public.is_admin()
    OR (tenant_id = public.current_tenant_id() AND public.has_role(auth.uid(), 'gc_owner'::public.app_role))
  );

-- 4/5. Trigger helpers are not API surface
REVOKE ALL ON FUNCTION public.ensure_profile_for_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;