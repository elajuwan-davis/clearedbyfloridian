ALTER TABLE public.permit_updates ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

CREATE POLICY "permit_updates_ack_by_client" ON public.permit_updates FOR UPDATE TO authenticated
USING (visible_to_client = true AND public.permit_in_current_tenant(permit_id))
WITH CHECK (visible_to_client = true AND public.permit_in_current_tenant(permit_id));

GRANT UPDATE (acknowledged_at) ON public.permit_updates TO authenticated;