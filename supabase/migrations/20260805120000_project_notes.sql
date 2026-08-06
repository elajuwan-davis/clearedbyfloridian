-- project_notes: GC-visible notes scoped to the permit's tenant
CREATE TABLE public.project_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL REFERENCES public.permits(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  author text NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_notes_permit_id_idx ON public.project_notes (permit_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_notes TO authenticated;
GRANT ALL ON public.project_notes TO service_role;

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_notes tenant select" ON public.project_notes
  FOR SELECT TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY "project_notes tenant insert" ON public.project_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY "project_notes tenant update" ON public.project_notes
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id())
  WITH CHECK (public.is_admin() OR tenant_id = public.current_tenant_id());

CREATE POLICY "project_notes tenant delete" ON public.project_notes
  FOR DELETE TO authenticated
  USING (public.is_admin() OR tenant_id = public.current_tenant_id());
