-- Utility locate tracking schema with daily expiry check.

CREATE TABLE IF NOT EXISTS public.utility_locates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID REFERENCES public.permits(id) ON DELETE CASCADE,
  ticket_number TEXT,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  excavation_date DATE NOT NULL,
  expiration_date DATE GENERATED ALWAYS AS (request_date + INTERVAL '30 days') STORED,
  excavation_type TEXT CHECK (excavation_type IN ('pool_spa','foundation','utilities','landscaping','other')),
  dig_area_description TEXT,
  site_contact_name TEXT,
  site_contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','cleared','action_required','expired')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.utility_locates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'utility_locates' AND policyname = 'tenant_access'
  ) THEN
    CREATE POLICY "tenant_access" ON public.utility_locates
      USING (permit_id IN (SELECT id FROM public.permits WHERE tenant_id = public.current_tenant_id()));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.expire_utility_locates()
RETURNS void AS $$
  UPDATE public.utility_locates
    SET status = 'expired'
    WHERE expiration_date < CURRENT_DATE AND status != 'expired';
$$ LANGUAGE sql;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-utility-locates',
  '0 0 * * *',
  'SELECT public.expire_utility_locates()'
);
