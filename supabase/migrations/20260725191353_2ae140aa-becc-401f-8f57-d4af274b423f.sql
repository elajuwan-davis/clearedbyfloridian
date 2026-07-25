
-- CO CHECKLIST -------------------------------------------------------------
CREATE TABLE public.co_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id uuid,
  item_key text NOT NULL,
  item_label text NOT NULL,
  ord integer NOT NULL DEFAULT 0,
  complete boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid,
  completed_by_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (permit_id, item_key)
);
CREATE INDEX co_checklist_items_permit_idx ON public.co_checklist_items(permit_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_checklist_items TO authenticated;
GRANT ALL ON public.co_checklist_items TO service_role;

ALTER TABLE public.co_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY co_checklist_select ON public.co_checklist_items FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id() OR public.sub_can_see_permit(permit_id));
CREATE POLICY co_checklist_insert ON public.co_checklist_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY co_checklist_update_admin ON public.co_checklist_items FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY co_checklist_delete_admin ON public.co_checklist_items FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER co_checklist_touch BEFORE UPDATE ON public.co_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- LIEN RELEASES ------------------------------------------------------------
CREATE TABLE public.lien_releases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id uuid,
  sub_key text NOT NULL,
  sub_company text NOT NULL,
  sub_email text,
  trade text,
  status text NOT NULL DEFAULT 'not_requested'
    CHECK (status IN ('not_requested','requested','signed','notarized','filed')),
  requested_at timestamptz,
  signed_at timestamptz,
  notarized_at timestamptz,
  filed_at timestamptz,
  last_reminder_at timestamptz,
  signwell_id text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (permit_id, sub_key)
);
CREATE INDEX lien_releases_permit_idx ON public.lien_releases(permit_id);
CREATE INDEX lien_releases_status_idx ON public.lien_releases(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lien_releases TO authenticated;
GRANT ALL ON public.lien_releases TO service_role;

ALTER TABLE public.lien_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY lien_releases_select ON public.lien_releases FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id() OR public.sub_can_see_permit(permit_id));
CREATE POLICY lien_releases_insert ON public.lien_releases FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY lien_releases_update_admin ON public.lien_releases FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY lien_releases_delete_admin ON public.lien_releases FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER lien_releases_touch BEFORE UPDATE ON public.lien_releases
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- VICTORIA ALERTS ----------------------------------------------------------
CREATE TABLE public.victoria_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid,
  user_id uuid,
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE,
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info','warning','critical','success')),
  title text NOT NULL,
  body text,
  action_url text,
  dedupe_key text,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dedupe_key)
);
CREATE INDEX victoria_alerts_tenant_idx ON public.victoria_alerts(tenant_id, created_at DESC);
CREATE INDEX victoria_alerts_permit_idx ON public.victoria_alerts(permit_id);
CREATE INDEX victoria_alerts_user_idx ON public.victoria_alerts(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.victoria_alerts TO authenticated;
GRANT ALL ON public.victoria_alerts TO service_role;

ALTER TABLE public.victoria_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY victoria_alerts_select ON public.victoria_alerts FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id() OR user_id = auth.uid());
CREATE POLICY victoria_alerts_insert ON public.victoria_alerts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());
CREATE POLICY victoria_alerts_update ON public.victoria_alerts FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id() OR user_id = auth.uid());
CREATE POLICY victoria_alerts_delete_admin ON public.victoria_alerts FOR DELETE TO authenticated
  USING (public.is_admin());
