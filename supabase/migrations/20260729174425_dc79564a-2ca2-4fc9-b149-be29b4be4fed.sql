CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid,
  actor_label text,
  summary text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_events_select" ON public.activity_events FOR SELECT TO authenticated
USING (public.is_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY "activity_events_insert_admin" ON public.activity_events FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.permit_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id uuid,
  message text NOT NULL,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_by_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.permit_updates TO authenticated;
GRANT ALL ON public.permit_updates TO service_role;
ALTER TABLE public.permit_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permit_updates_select" ON public.permit_updates FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR (visible_to_client = true AND public.permit_in_current_tenant(permit_id))
);

CREATE POLICY "permit_updates_insert_admin" ON public.permit_updates FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS activity_events_permit_idx ON public.activity_events(permit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS permit_updates_permit_idx ON public.permit_updates(permit_id, created_at DESC);