CREATE TABLE public.design_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid,
  role text NOT NULL DEFAULT 'architect',
  firm_name text NOT NULL,
  contact_name text,
  license_number text,
  email text,
  phone text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_professionals TO authenticated;
GRANT ALL ON public.design_professionals TO service_role;

ALTER TABLE public.design_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view design pros"
  ON public.design_professionals FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can insert design pros"
  ON public.design_professionals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update design pros"
  ON public.design_professionals FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete design pros"
  ON public.design_professionals FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER trg_design_pros_updated_at
  BEFORE UPDATE ON public.design_professionals
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
