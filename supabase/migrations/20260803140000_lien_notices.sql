-- Lien notice tracking schema with daily deadline check.

CREATE TABLE IF NOT EXISTS public.lien_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  notice_type TEXT NOT NULL CHECK (notice_type IN ('preliminary_notice','mechanics_lien','lien_release','bond_claim')),
  filed_date DATE,
  deadline_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('filed','pending','overdue','not_required')),
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
      USING (project_id IN (SELECT id FROM public.projects WHERE tenant_id = auth.uid()));
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
