-- COI tracking schema and private document storage.
-- Ensures projects table exists for tenant scoping and creates coi_records
-- with a computed status based on expiration_date.

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Do not recreate subcontractors if it already exists; reference it below.
CREATE TABLE IF NOT EXISTS public.coi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  coverage_type TEXT NOT NULL,
  policy_number TEXT,
  carrier_name TEXT,
  effective_date DATE,
  expiration_date DATE NOT NULL,
  document_url TEXT,
  status TEXT GENERATED ALWAYS AS (
    CASE
      WHEN expiration_date < CURRENT_DATE THEN 'expired'
      WHEN expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
      ELSE 'active'
    END
  ) STORED,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coi_records_project_expiry
  ON public.coi_records (project_id, expiration_date);

ALTER TABLE public.coi_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coi_records' AND policyname = 'tenant_access'
  ) THEN
    CREATE POLICY "tenant_access" ON public.coi_records
      USING (project_id IN (SELECT id FROM public.projects WHERE tenant_id = auth.uid()));
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('coi-documents', 'coi-documents', false)
ON CONFLICT (id) DO NOTHING;
