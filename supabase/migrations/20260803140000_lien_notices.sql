-- Lien notice tracking for notice types not already covered by live tables:
--   - nto_filings  covers preliminary notice (Notice to Owner)
--   - lien_releases covers sub-specific lien releases
-- This table covers: mechanics_lien and bond_claim deadlines.

CREATE TABLE IF NOT EXISTS public.lien_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID REFERENCES public.permits(id) ON DELETE CASCADE,
  notice_type TEXT NOT NULL CHECK (notice_type IN ('mechanics_lien', 'bond_claim')),
  filed_date DATE,
  deadline_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('filed', 'pending', 'overdue', 'not_required')),
  property_owner TEXT,
  contractor_name TEXT,
  project_address TEXT,
  scope_of_work TEXT,
  document_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lien_notices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lien_notices' AND policyname = 'tenant_access'
  ) THEN
    CREATE POLICY "tenant_access" ON public.lien_notices
      USING (permit_id IN (SELECT id FROM public.permits WHERE tenant_id = public.current_tenant_id()));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_lien_deadlines()
RETURNS void AS $$
  UPDATE public.lien_notices
    SET status = 'overdue'
    WHERE deadline_date < CURRENT_DATE AND status = 'pending';
$$ LANGUAGE sql;

-- Daily cron at midnight UTC.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'check-lien-deadlines',
  '0 0 * * *',
  'SELECT public.check_lien_deadlines()'
);
