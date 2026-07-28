-- 1. HOA submittal events: no anonymous / null-tenant inserts
DROP POLICY IF EXISTS "sub_events_insert" ON public.hoa_submittal_events;
CREATE POLICY "sub_events_insert" ON public.hoa_submittal_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id()));

DROP POLICY IF EXISTS "sub_events_select" ON public.hoa_submittal_events;
CREATE POLICY "sub_events_select" ON public.hoa_submittal_events
  FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

-- 2. Other blanket "public" role policies limited to authenticated
DROP POLICY IF EXISTS "sub_replies_select" ON public.hoa_submittal_replies;
CREATE POLICY "sub_replies_select" ON public.hoa_submittal_replies
  FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS "sub_replies_insert" ON public.hoa_submittal_replies;
CREATE POLICY "sub_replies_insert" ON public.hoa_submittal_replies
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR (tenant_id IS NOT NULL AND tenant_id = public.current_tenant_id()));

DROP POLICY IF EXISTS "tpl_versions_select" ON public.hoa_template_versions;
CREATE POLICY "tpl_versions_select" ON public.hoa_template_versions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR tenant_id = public.current_tenant_id() OR public.is_admin());

DROP POLICY IF EXISTS "Tenant views own service fee invoices" ON public.service_fee_invoices;
CREATE POLICY "Tenant views own service fee invoices" ON public.service_fee_invoices
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id() OR public.is_admin());

-- 3. access_requests: replace always-true insert with a validated check
DROP POLICY IF EXISTS "Anyone can request access" ON public.access_requests;
CREATE POLICY "Anyone can request access" ON public.access_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND approved_tenant_id IS NULL
    AND length(btrim(name)) BETWEEN 2 AND 120
    AND length(btrim(email)) BETWEEN 5 AND 200
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND coalesce(length(notes), 0) <= 2000
  );

-- 4. Lock down SECURITY DEFINER functions that must never be API-callable
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_invite_token(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC, anon, authenticated;

-- Helper predicates used inside RLS: keep for authenticated, drop anon/public
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.permit_in_current_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sub_can_see_permit(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.intel_municipality_stats(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.intel_common_corrections(text, text, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.permit_in_current_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sub_can_see_permit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intel_municipality_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.intel_common_corrections(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_invite_token(uuid) TO service_role;
