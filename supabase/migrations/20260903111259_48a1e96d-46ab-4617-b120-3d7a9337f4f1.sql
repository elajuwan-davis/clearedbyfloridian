CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text NOT NULL,
  county text,
  permit_type text,
  estimate_days_low integer,
  estimate_days_high integer,
  estimate_fee_low integer,
  estimate_fee_high integer,
  source text NOT NULL DEFAULT 'seo-landing-page',
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;
CREATE POLICY "leads_public_insert" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "leads_admin_select" ON public.leads;
CREATE POLICY "leads_admin_select" ON public.leads
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);