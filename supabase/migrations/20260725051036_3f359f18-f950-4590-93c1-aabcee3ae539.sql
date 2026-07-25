CREATE TABLE public.prior_permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  permit_number text,
  project_label text NOT NULL,
  trades jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents bigint NOT NULL DEFAULT 0,
  date_pulled date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prior_permits TO authenticated;
GRANT ALL ON public.prior_permits TO service_role;

ALTER TABLE public.prior_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all prior permits" ON public.prior_permits
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert prior permits" ON public.prior_permits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update prior permits" ON public.prior_permits
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete prior permits" ON public.prior_permits
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER prior_permits_touch_updated_at
  BEFORE UPDATE ON public.prior_permits
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();