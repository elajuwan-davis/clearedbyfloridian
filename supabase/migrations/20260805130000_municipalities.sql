-- municipalities: statewide building-dept directory
CREATE TABLE public.municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  county text NOT NULL,
  department text,
  portal_url text,
  submittal_method text,
  turnaround_notes text,
  quirks text,
  readiness_score integer,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, county)
);

CREATE INDEX municipalities_name_idx ON public.municipalities (name);
CREATE INDEX municipalities_county_idx ON public.municipalities (county);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.municipalities TO authenticated;
GRANT ALL ON public.municipalities TO service_role;

ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "municipalities read all authenticated" ON public.municipalities
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "municipalities admin insert" ON public.municipalities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "municipalities admin update" ON public.municipalities
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "municipalities admin delete" ON public.municipalities
  FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE TRIGGER municipalities_touch_updated_at
  BEFORE UPDATE ON public.municipalities
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
