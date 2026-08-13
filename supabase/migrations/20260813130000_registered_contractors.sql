-- Registered contractors — the licensed firms offered in the NTBO / Owner
-- Authorization generators. Previously localStorage-only, so the registry was
-- per-browser and staff could not see each other's entries.

CREATE TABLE IF NOT EXISTS public.registered_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'CGC'
    CHECK (license_type IN ('CPC', 'CGC', 'CBC', 'CRC', 'EC', 'CFC', 'CAC', 'SI', 'Other')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS registered_contractors_license_idx
  ON public.registered_contractors (upper(license_number));
CREATE INDEX IF NOT EXISTS registered_contractors_active_idx
  ON public.registered_contractors (active, firm_name);

ALTER TABLE public.registered_contractors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'registered_contractors'
      AND policyname = 'registered_contractors_select'
  ) THEN
    -- Any signed-in user generating a permit document needs to read the roster;
    -- only admins may change it.
    CREATE POLICY "registered_contractors_select" ON public.registered_contractors
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'registered_contractors'
      AND policyname = 'registered_contractors_insert'
  ) THEN
    CREATE POLICY "registered_contractors_insert" ON public.registered_contractors
      FOR INSERT TO authenticated WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'registered_contractors'
      AND policyname = 'registered_contractors_update'
  ) THEN
    CREATE POLICY "registered_contractors_update" ON public.registered_contractors
      FOR UPDATE TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'registered_contractors'
      AND policyname = 'registered_contractors_delete'
  ) THEN
    CREATE POLICY "registered_contractors_delete" ON public.registered_contractors
      FOR DELETE TO authenticated USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registered_contractors TO authenticated;
GRANT ALL ON public.registered_contractors TO service_role;

-- The record document generation has always defaulted to.
INSERT INTO public.registered_contractors
  (firm_name, contact_name, address, phone, email, license_number, license_type, active)
VALUES (
  'Cleard',
  'Elajuwan Davis',
  '1000 S Pine Island Rd, Suite 155, Plantation, FL 33324',
  '(561) 555-0100',
  'info@cleard.com',
  'CPC1459161',
  'CPC',
  true
)
ON CONFLICT (upper(license_number)) DO NOTHING;
